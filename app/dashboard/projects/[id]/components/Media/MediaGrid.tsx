// app/dashboard/projects/[id]/components/Media/MediaGrid.tsx
// @ts-nocheck
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Upload, Loader2, Link2, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { MediaCard } from "./MediaCard";
import { MediaDialogs } from "./MediaDialogs";
import {
  createReviewLinkAction,
  getReviewLinksAction,
  toggleReviewLinkAction,
  updateReviewLinkAction,
  deleteReviewLinkAction,
  reorderVersionsAction,
  updateVersionNameAction,
  updateMediaStatusAction,
} from "../../lib/GeneralActions";
import {
  MediaFile,
  OrganizedMedia,
  ReviewLink,
} from "@/app/dashboard/lib/types";
import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectReferencesDialog } from "./ProjectReferencesDialog";
import {
  deleteMediaAction,
  deleteVersionAction,
} from "../../lib/DeleteMediaActions";
import {
  UploadValidator,
  getUploadValidatorData,
  uploadFiles as performUpload,
} from "../../lib/UploadLogic";
import { uploadFilesWithThumbnails } from "../../lib/uploadWithThumbnails";

interface MediaGridProps {
  mediaFiles: MediaFile[];
  reviewLinks: ReviewLink[];
  selectedMedia: MediaFile | null;
  onMediaSelect: (media: MediaFile | null) => void;
  onMediaUpdated: (newFiles: MediaFile[]) => void;
  onReviewLinksUpdated: (newLinks: ReviewLink[]) => void;
  projectId: string;
  project: any;
  userPermissions: {
    canUpload: boolean;
    canDelete: boolean;
    canEditStatus: boolean;
    canCreateReviewLinks: boolean;
  };
}

export function MediaGrid({
  mediaFiles,
  reviewLinks,
  selectedMedia,
  onMediaSelect,
  onMediaUpdated,
  onReviewLinksUpdated,
  projectId,
  project,
  userPermissions,
}: MediaGridProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());
  const [draggedMedia, setDraggedMedia] = useState<MediaFile | null>(null);
  const [uploadValidator, setUploadValidator] =
    useState<UploadValidator | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);

  // Dialog states
  const [createLinkDialog, setCreateLinkDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  }>({ open: false, isCreating: false, showSuccess: false });

  const [viewLinksDialog, setViewLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }>({ open: false, links: [], isLoading: false });

  const [manageLinksDialog, setManageLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }>({ open: false, links: [], isLoading: false });

  const [versionManagerDialog, setVersionManagerDialog] = useState<{
    open: boolean;
    media?: OrganizedMedia;
    isUpdating: boolean;
  }>({ open: false, isUpdating: false });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  }>({ open: false, isDeleting: false });

  const [referencesDialog, setReferencesDialog] = useState<{
    open: boolean;
  }>({ open: false });


  // Initialize upload validator
  useEffect(() => {
    const initializeValidator = async () => {
      try {
        setIsLoadingLimits(true);
        const { subscription, projectUsage } = await getUploadValidatorData(
          projectId,
          mediaFiles
        );
        const validator = new UploadValidator(subscription, projectUsage);
        setUploadValidator(validator);
      } catch (error) {
        console.error("Failed to initialize upload validator:", error);
        toast({
          title: "Warning",
          description:
            "Could not load upload limits. Upload may be restricted.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLimits(false);
      }
    };

    initializeValidator();
  }, [projectId, mediaFiles]);

  // Re-calculate project usage when media files change
  useEffect(() => {
    if (uploadValidator) {
      const updateValidator = async () => {
        try {
          const { subscription, projectUsage } = await getUploadValidatorData(
            projectId,
            mediaFiles
          );
          const newValidator = new UploadValidator(subscription, projectUsage);
          setUploadValidator(newValidator);
        } catch (error) {
          console.error("Failed to update upload validator:", error);
        }
      };

      updateValidator();
    }
  }, [mediaFiles.length]); // Only when the number of files changes

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onDrop(files, []);
    }
    event.target.value = "";
  };

const organizedMedia = React.useMemo((): OrganizedMedia[] => {
  const parentMediaMap = new Map<string, MediaFile>();
  const childVersionsMap = new Map<string, MediaFile[]>();
  const orphanedVersions: MediaFile[] = [];

  // First pass: identify parent media and group versions
  mediaFiles.forEach((file) => {
    if (!file.parent_media_id) {
      // This is a parent media
      parentMediaMap.set(file.id, file);
      if (!childVersionsMap.has(file.id)) {
        childVersionsMap.set(file.id, []);
      }
    } else {
      // This is a child version - check if parent exists
      const parentExists = mediaFiles.some(m => m.id === file.parent_media_id);
      
      if (parentExists) {
        // Parent exists, add to children map
        if (!childVersionsMap.has(file.parent_media_id)) {
          childVersionsMap.set(file.parent_media_id, []);
        }
        childVersionsMap.get(file.parent_media_id)!.push(file);
      } else {
        // Parent doesn't exist, treat as orphaned - make it a new parent
      
        orphanedVersions.push({
          ...file,
          parent_media_id: null,
          version_number: 1,
          is_current_version: true
        });
      }
    }
  });

  // Handle orphaned versions by promoting them to parents
  orphanedVersions.forEach(orphan => {
    parentMediaMap.set(orphan.id, orphan);
    if (!childVersionsMap.has(orphan.id)) {
      childVersionsMap.set(orphan.id, []);
    }
  });

  // Second pass: create organized structure
  const result: OrganizedMedia[] = [];

  parentMediaMap.forEach((parentMedia, parentId) => {
    const versions = childVersionsMap.get(parentId) || [];
    
    // Sort versions by version number (ascending)
    const sortedVersions = versions.sort(
      (a, b) => a.version_number - b.version_number
    );

    // Find current version - prioritize the one marked as current
    let currentVersion = parentMedia;
    
    // First check if parent is marked as current
    if (parentMedia.is_current_version) {
      currentVersion = parentMedia;
    } else {
      // If parent is not current, find the current version among children
      const currentVersionFromChildren = sortedVersions.find(
        (v) => v.is_current_version
      );
      
      if (currentVersionFromChildren) {
        currentVersion = currentVersionFromChildren;
      } else {
        // If no version is marked as current, use the highest version number
        const allInGroup = [parentMedia, ...sortedVersions];
        const highestVersion = allInGroup.sort(
          (a, b) => b.version_number - a.version_number
        )[0];
        currentVersion = highestVersion;
      }
    }

    // Check if this parent media has review links
    const hasReviewLinks = reviewLinks.some(
      (link) => link.media_id === parentId
    );

    // Create the organized media object
    const organizedMediaItem: OrganizedMedia = {
      id: parentMedia.id,
      filename: parentMedia.filename,
      original_filename: parentMedia.original_filename,
      file_type: parentMedia.file_type,
      mime_type: parentMedia.mime_type,
      file_size: parentMedia.file_size,
      r2_url: parentMedia.r2_url,
      uploaded_at: parentMedia.uploaded_at,
      version_number: parentMedia.version_number,
      is_current_version: parentMedia.is_current_version,
      version_name: parentMedia.version_name,
      parent_media_id: parentMedia.parent_media_id, // Should be null for parents
      status: parentMedia.status,
      thumbnail_r2_url: parentMedia.thumbnail_r2_url,
      versions: sortedVersions,
      currentVersion: currentVersion,
      hasReviewLinks: hasReviewLinks,
    };

    result.push(organizedMediaItem);
  });

  // Sort final result by upload date (newest first)
  return result.sort(
    (a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}, [mediaFiles, reviewLinks]);

  // Upload files function using new upload logic
  const uploadFilesHandler = async (files: File[], targetMediaId?: string) => {
  if (!uploadValidator) {
    toast({
      title: "Upload Error",
      description: "Upload validator not initialized. Please refresh the page.",
      variant: "destructive",
    });
    return;
  }

  // Check if validator allows upload
  if (!uploadValidator.canUploadFiles(files)) {
    uploadValidator.showUploadError(files);
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);

  try {
   
    
    const response = await uploadFilesWithThumbnails(
      files,
      projectId,
      targetMediaId,
      setUploadProgress
    );

   

    if (response.ok) {
      const result = await response.json();
     
      
      if (result.files) {
        const newFiles = [...mediaFiles, ...result.files];
        onMediaUpdated(newFiles);

        if (targetMediaId) {
          setExpandedMedia((prev) => new Set(prev).add(targetMediaId));
        }

        toast({
          title: "Upload Complete",
          description: result.message,
          variant: "green",
        });
      }
    } else {
      const error = await response.json();
      console.error("Upload error response:", error);
      throw new Error(error.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    toast({
      title: "Upload Failed",
      description: error instanceof Error ? error.message : "Upload failed",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
    setDraggedOver(null);
    setDraggedMedia(null);
  }
};

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length === 0) return;

      if (!uploadValidator) {
        toast({
          title: "Upload Error",
          description: "Upload system not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (draggedOver) {
        await uploadFilesHandler(acceptedFiles, draggedOver);
      } else {
        await uploadFilesHandler(acceptedFiles);
      }
    },
    [draggedOver, uploadValidator]
  );

  // Get upload status for UI
  const uploadStatus = uploadValidator?.getUploadStatus();
  const projectUsage = uploadValidator?.getProjectUsage();
  const uploadLimits = uploadValidator?.getUploadLimits();

  // Action handlers
  const handleVersionReorder = async (
    parentId: string,
    reorderedVersions: MediaFile[]
  ) => {
    const result = await reorderVersionsAction(parentId, reorderedVersions);

    if (result.success) {
      const updatedFiles = mediaFiles.map((file) => {
        const updatedVersion = reorderedVersions.find((v) => v.id === file.id);
        if (updatedVersion) {
          return {
            ...file,
            version_number: updatedVersion.version_number,
            is_current_version: updatedVersion.is_current_version,
          };
        }
        return file;
      });

      onMediaUpdated(updatedFiles);

      toast({
        title: "Versions Reordered",
        description: "Version order has been updated",
        variant: "cyan",
      });
    } else {
      toast({
        title: "Failed to Reorder Versions",
        description: result.error,
        variant: "destructive",
      });
    }
  };

const handleCreateVersion = React.useCallback(
  async (targetMediaId: string, sourceMediaId: string) => {
    
    // ✅ Store original state for rollback
    const originalMediaFiles = [...mediaFiles];

    try {
      // ✅ 1. FIND THE SOURCE MEDIA AND DETERMINE WHAT TO MOVE
      const draggedMedia = mediaFiles.find((m) => m.id === sourceMediaId);
      if (!draggedMedia) {
        throw new Error("Source media not found");
      }

      const sourceParentId = draggedMedia.parent_media_id || draggedMedia.id;
      const sourceGroup = mediaFiles.filter(
        (m) => m.id === sourceParentId || m.parent_media_id === sourceParentId
      );

      // ✅ ALWAYS move the CURRENT VERSION of the source group
      const currentVersion = sourceGroup.find((m) => m.is_current_version);
      const mediaToMoveId = currentVersion?.id || sourceMediaId;
      const mediaToMove = mediaFiles.find((m) => m.id === mediaToMoveId);

      if (!mediaToMove) {
        throw new Error("Media to move not found");
      }


      // ✅ 2. GET TARGET GROUP INFO AND CALCULATE NEXT VERSION NUMBER
      const targetGroup = mediaFiles.filter(
        (m) => m.id === targetMediaId || m.parent_media_id === targetMediaId
      );
      
      // ✅ Find the HIGHEST version number in target group and add 1
      const maxVersionInTarget = Math.max(...targetGroup.map((m) => m.version_number));
      const nextVersionNumber = maxVersionInTarget + 1;


      // ✅ 3. CALCULATE OPTIMISTIC STATE
      const optimisticFiles = mediaFiles.map((file) => {
        // Update the media being moved
        if (file.id === mediaToMoveId) {
          return {
            ...file,
            parent_media_id: targetMediaId,
            version_number: nextVersionNumber,
            display_order: nextVersionNumber,
            is_current_version: true, // New version becomes current
          };
        }

        // Set all target group members to not current (new version takes over)
        if (targetGroup.some((m) => m.id === file.id)) {
          return {
            ...file,
            is_current_version: false,
          };
        }

        // ✅ REORGANIZE SOURCE GROUP (if we moved the current version from a multi-version group)
        if (
          mediaToMoveId !== sourceParentId && // We're not moving the parent itself
          sourceGroup.some((m) => m.id === file.id) // This file is in the source group
        ) {
          const remainingInSource = sourceGroup.filter(
            (m) => m.id !== mediaToMoveId
          );

          if (remainingInSource.length > 0) {
            // ✅ Find the HIGHEST version among remaining to be new current
            const newCurrentInSource = remainingInSource.reduce((highest, current) =>
              current.version_number > highest.version_number ? current : highest
            );

            if (file.id === newCurrentInSource.id) {
              return {
                ...file,
                is_current_version: true, // Highest remaining version becomes current
              };
            } else {
              return {
                ...file,
                is_current_version: false,
              };
            }
          }
        }

        return file;
      });

      // ✅ 4. APPLY OPTIMISTIC UPDATE IMMEDIATELY
      onMediaUpdated(optimisticFiles);
      setExpandedMedia((prev) => new Set(prev).add(targetMediaId));

      // ✅ 5. EXECUTE DATABASE UPDATES
      const supabase = createClient();
      const updates = [];

      // Update the media being moved
      updates.push(
        supabase
          .from("project_media")
          .update({
            parent_media_id: targetMediaId,
            version_number: nextVersionNumber,
            is_current_version: true,
          })
          .eq("id", mediaToMoveId)
      );

      // Set all target group members to not current
      updates.push(
        supabase
          .from("project_media")
          .update({ is_current_version: false })
          .in(
            "id",
            targetGroup.map((m) => m.id)
          )
      );

      // ✅ Handle source group reorganization if needed
      if (mediaToMoveId !== sourceParentId) {
        const remainingInSource = sourceGroup.filter(
          (m) => m.id !== mediaToMoveId
        );

        if (remainingInSource.length > 0) {
          // ✅ Find the HIGHEST version among remaining
          const newCurrentInSource = remainingInSource.reduce((highest, current) =>
            current.version_number > highest.version_number ? current : highest
          );


          // Set the highest version as current in source group
          updates.push(
            supabase
              .from("project_media")
              .update({ is_current_version: true })
              .eq("id", newCurrentInSource.id)
          );

          // Set all other remaining versions as not current
          const otherVersionsInSource = remainingInSource.filter(
            (m) => m.id !== newCurrentInSource.id
          );
          
          if (otherVersionsInSource.length > 0) {
            updates.push(
              supabase
                .from("project_media")
                .update({ is_current_version: false })
                .in(
                  "id",
                  otherVersionsInSource.map((m) => m.id)
                )
            );
          }
        }
      }

      // ✅ Execute all updates in parallel
      const results = await Promise.allSettled(updates);

      // Check for any failures
      const failures = results.filter(
        (result) => result.status === "rejected"
      );
      if (failures.length > 0) {
        console.error("❌ Some updates failed:", failures);
        throw new Error(`${failures.length} database updates failed`);
      }

      // ✅ Success - keep optimistic update
      const movedMediaName = mediaToMove.original_filename;
      const targetName = mediaFiles.find(
        (m) => m.id === targetMediaId
      )?.original_filename;


      toast({
        title: "Version Created",
        description: `"${movedMediaName}" is now version ${nextVersionNumber} of "${targetName}"`,
        variant: "green",
      });
      
    } catch (error) {
      console.error("❌ Error in handleCreateVersion:", error);

      // ✅ ROLLBACK ON ANY ERROR
      onMediaUpdated(originalMediaFiles);
      setExpandedMedia((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetMediaId);
        return newSet;
      });

      toast({
        title: "Failed to Create Version",
        description:
          error instanceof Error ? error.message : "Database error occurred",
        variant: "destructive",
      });
    }
  },
  [mediaFiles, onMediaUpdated]
);

const handleDeleteMedia = async (mediaFile: MediaFile) => {
  setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

  // Always delete the current version being displayed
  const result = await deleteMediaAction(projectId, mediaFile.id);

  if (result.success) {
    const deletedMediaId = mediaFile.id;
    const parentId = mediaFile.parent_media_id || mediaFile.id;
    const mediaGroup = mediaFiles.filter(
      (file) => file.id === parentId || file.parent_media_id === parentId
    );
    
    const remainingInGroup = mediaGroup.filter(m => m.id !== deletedMediaId);
    
    let updatedFiles = [...mediaFiles];
    let newParentId = null;
    
    if (remainingInGroup.length === 0) {
      // Last media in group was deleted - remove it and close dialog
      updatedFiles = mediaFiles.filter((file) => file.id !== deletedMediaId);
      
      // ✅ CLOSE VERSION MANAGER DIALOG when group is empty
      if (versionManagerDialog.open && 
          (versionManagerDialog.media?.id === parentId || 
           versionManagerDialog.media?.currentVersion.id === mediaFile.id)) {
        setVersionManagerDialog({ open: false, isUpdating: false });
      }
    } else {
      // Media group was reorganized
      updatedFiles = mediaFiles.filter((file) => file.id !== deletedMediaId);
      
      if (!mediaFile.parent_media_id) {
        // We deleted a parent - promote first version to parent
        const sortedRemaining = remainingInGroup
          .filter(m => m.id !== deletedMediaId)
          .sort((a, b) => a.version_number - b.version_number);
        
        if (sortedRemaining.length > 0) {
          const newParent = sortedRemaining[0];
          newParentId = newParent.id;
          
          // Update the files array with new structure
          updatedFiles = updatedFiles.map(file => {
            if (file.id === newParent.id) {
              return {
                ...file,
                parent_media_id: null,
                version_number: 1,
                is_current_version: true
              };
            }
            if (sortedRemaining.slice(1).some(m => m.id === file.id)) {
              const newVersionNumber = sortedRemaining.slice(1).findIndex(m => m.id === file.id) + 2;
              return {
                ...file,
                parent_media_id: newParent.id,
                version_number: newVersionNumber,
                is_current_version: false
              };
            }
            return file;
          });

          // ✅ UPDATE VERSION MANAGER DIALOG WITH COMPLETELY NEW STRUCTURE
          if (versionManagerDialog.open && 
              (versionManagerDialog.media?.id === parentId)) {
            
            // Create the new organized media structure
            const newParentData = updatedFiles.find(f => f.id === newParent.id);
            const newVersionsData = updatedFiles.filter(f => f.parent_media_id === newParent.id);
            
            if (newParentData) {
              const updatedDialogMedia = {
                id: newParentData.id,
                filename: newParentData.filename,
                original_filename: newParentData.original_filename,
                file_type: newParentData.file_type,
                mime_type: newParentData.mime_type,
                file_size: newParentData.file_size,
                r2_url: newParentData.r2_url,
                uploaded_at: newParentData.uploaded_at,
                version_number: newParentData.version_number,
                is_current_version: newParentData.is_current_version,
                version_name: newParentData.version_name,
                parent_media_id: newParentData.parent_media_id,
                versions: newVersionsData,
                currentVersion: newParentData, // New parent is now current
                hasReviewLinks: versionManagerDialog.media.hasReviewLinks
              };
              
              setVersionManagerDialog({
                open: true,
                media: updatedDialogMedia,
                isUpdating: false
              });
            }
          }
        }
      } else if (mediaFile.is_current_version && remainingInGroup.length > 0) {
        // We deleted current version - promote highest version number to current
        const newCurrentVersion = remainingInGroup
          .filter(m => m.id !== deletedMediaId)
          .sort((a, b) => b.version_number - a.version_number)[0];
        
        if (newCurrentVersion) {
          updatedFiles = updatedFiles.map(file => {
            if (file.id === newCurrentVersion.id) {
              return { ...file, is_current_version: true };
            }
            return file;
          });

          // ✅ UPDATE VERSION MANAGER DIALOG WITH NEW CURRENT VERSION
          if (versionManagerDialog.open && 
              (versionManagerDialog.media?.id === parentId || 
               versionManagerDialog.media?.currentVersion.id === mediaFile.id)) {
            
            const parentData = updatedFiles.find(f => f.id === parentId);
            const versionsData = updatedFiles.filter(f => f.parent_media_id === parentId);
            const currentVersionData = updatedFiles.find(f => f.id === newCurrentVersion.id);
            
            if (parentData && currentVersionData) {
              const updatedDialogMedia = {
                id: parentData.id,
                filename: parentData.filename,
                original_filename: parentData.original_filename,
                file_type: parentData.file_type,
                mime_type: parentData.mime_type,
                file_size: parentData.file_size,
                r2_url: parentData.r2_url,
                uploaded_at: parentData.uploaded_at,
                version_number: parentData.version_number,
                is_current_version: parentData.is_current_version,
                version_name: parentData.version_name,
                parent_media_id: parentData.parent_media_id,
                versions: versionsData,
                currentVersion: currentVersionData,
                hasReviewLinks: versionManagerDialog.media.hasReviewLinks
              };
              
              setVersionManagerDialog({
                open: true,
                media: updatedDialogMedia,
                isUpdating: false
              });
            }
          }
        }
      }
    }
    
    // ✅ ALWAYS UPDATE THE MAIN MEDIA STATE - THIS IS CRITICAL!
    onMediaUpdated(updatedFiles);

    // Handle review links (same as before)
    const updatedLinks = reviewLinks.map(link => {
      if (link.media_id === parentId && newParentId && !mediaFile.parent_media_id) {
        return { ...link, media_id: newParentId };
      }
      return link;
    }).filter(link => {
      if (remainingInGroup.length === 0 && link.media_id === parentId) {
        return false;
      }
      const linkTargetExists = updatedFiles.some(media => {
        if (!media.parent_media_id && media.id === link.media_id) {
          return true;
        }
        if (!media.parent_media_id && updatedFiles.some(m => m.parent_media_id === media.id)) {
          return media.id === link.media_id;
        }
        return false;
      });
      return linkTargetExists;
    });
    
    onReviewLinksUpdated(updatedLinks);

    toast({
      title: "Media Deleted",
      description: "Current version has been deleted",
      variant: "green",
    });

    setDeleteDialog({ open: false, isDeleting: false });
  } else {
    setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    toast({
      title: "Failed to Delete Media",
      description: result.error,
      variant: "destructive",
    });
  }
};

  const handleCreateReviewLink = async (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
    }
  ) => {
    setCreateLinkDialog((prev) => ({ ...prev, isCreating: true }));

    const result = await createReviewLinkAction(
      projectId,
      mediaFile.id,
      options
    );

    if (result.success) {
      try {
        await navigator.clipboard.writeText(result.reviewUrl!);
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }

      // Update review links
      const updatedLinks = [...reviewLinks, result.reviewLink];
      onReviewLinksUpdated(updatedLinks);

      setCreateLinkDialog((prev) => ({
        ...prev,
        isCreating: false,
        showSuccess: true,
        createdUrl: result.reviewUrl,
      }));

      toast({
        title: "Review Link Created",
        description: "Review link has been copied to your clipboard!",
        variant: "green",
      });
    } else {
      setCreateLinkDialog((prev) => ({ ...prev, isCreating: false }));
      toast({
        title: "Failed to Create Review Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleViewReviewLinks = async (mediaFile: MediaFile) => {
    setViewLinksDialog({ open: true, mediaFile, links: [], isLoading: true });

    const result = await getReviewLinksAction(projectId, mediaFile.id);

    if (result.success) {
      setViewLinksDialog((prev) => ({
        ...prev,
        links: result.links || [],
        isLoading: false,
      }));
    } else {
      toast({
        title: "Failed to Load Review Links",
        description: result.error,
        variant: "destructive",
      });
      setViewLinksDialog({ open: false, links: [], isLoading: false });
    }
  };

  const handleManageReviewLinks = async (mediaFile: MediaFile) => {
    setManageLinksDialog({ open: true, mediaFile, links: [], isLoading: true });

    const result = await getReviewLinksAction(projectId, mediaFile.id);

    if (result.success) {
      setManageLinksDialog((prev) => ({
        ...prev,
        links: result.links || [],
        isLoading: false,
      }));
    } else {
      toast({
        title: "Failed to Load Review Links",
        description: result.error,
        variant: "destructive",
      });
      setManageLinksDialog({ open: false, links: [], isLoading: false });
    }
  };

  const handleToggleReviewLink = async (
    linkId: string,
    currentStatus: boolean
  ) => {
    const result = await toggleReviewLinkAction(linkId, !currentStatus);

    if (result.success) {
      // Update all dialogs and main state
      const updateLinks = (links: ReviewLink[]) =>
        links.map((link) =>
          link.id === linkId ? { ...link, is_active: !currentStatus } : link
        );

      setViewLinksDialog((prev) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      setManageLinksDialog((prev) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      onReviewLinksUpdated(updateLinks(reviewLinks));

      toast({
        title: "Link Updated",
        description: `Review link ${!currentStatus ? "activated" : "deactivated"}`,
        variant: "green",
      });
    } else {
      toast({
        title: "Failed to Update Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleUpdateReviewLink = async (linkId: string, updates: any) => {
    const result = await updateReviewLinkAction(linkId, updates);

    if (result.success) {
      const updateLinks = (links: ReviewLink[]) =>
        links.map((link) =>
          link.id === linkId ? { ...link, ...updates } : link
        );

      setManageLinksDialog((prev) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      onReviewLinksUpdated(updateLinks(reviewLinks));
    } else {
      toast({
        title: "Failed to Update Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteReviewLink = async (linkId: string) => {
    const result = await deleteReviewLinkAction(linkId);

    if (result.success) {
      const filterLinks = (links: ReviewLink[]) =>
        links.filter((link) => link.id !== linkId);

      setViewLinksDialog((prev) => ({
        ...prev,
        links: filterLinks(prev.links),
      }));

      setManageLinksDialog((prev) => ({
        ...prev,
        links: filterLinks(prev.links),
      }));

      onReviewLinksUpdated(filterLinks(reviewLinks));

      toast({
        title: "Link Deleted",
        description: "Review link has been deleted",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Failed to Delete Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleUpdateVersionName = async (versionId: string, name: string) => {
    const result = await updateVersionNameAction(versionId, name);

    if (result.success) {
      const updatedFiles = mediaFiles.map((file) =>
        file.id === versionId ? { ...file, version_name: name } : file
      );
      onMediaUpdated(updatedFiles);
    } else {
      toast({
        title: "Failed to Update Version Name",
        description: result.error,
        variant: "destructive",
      });
    }
  };

const handleDeleteVersion = async (versionId: string) => {
  
  const result = await deleteVersionAction(versionId);

  if (result.success) {
    // Find the deleted version and its group
    const deletedVersion = mediaFiles.find(f => f.id === versionId);
    if (!deletedVersion) {
      toast({
        title: "Version Deleted",
        description: "Version has been deleted",
        variant: "destructive",
      });
      return;
    }

    const parentId = deletedVersion.parent_media_id;
    let updatedFiles = mediaFiles.filter((file) => file.id !== versionId);

    // If this was the current version, update the current version flag
    if (deletedVersion.is_current_version && parentId) {
      const remainingVersions = updatedFiles.filter(
        f => f.id === parentId || f.parent_media_id === parentId
      );
      
      if (remainingVersions.length > 0) {
        const newCurrentVersion = remainingVersions
          .sort((a, b) => b.version_number - a.version_number)[0];
        
        updatedFiles = updatedFiles.map(file => {
          if (file.id === newCurrentVersion.id) {
            return { ...file, is_current_version: true };
          }
          return file;
        });
      }
    }

    // ✅ UPDATE MAIN UI STATE
    onMediaUpdated(updatedFiles);

    // ✅ UPDATE VERSION MANAGER DIALOG IF OPEN
    if (versionManagerDialog.open && versionManagerDialog.media) {
      const currentDialogParentId = versionManagerDialog.media.id;
      
      // If the deleted version was part of the currently open dialog
      if (parentId === currentDialogParentId || deletedVersion.id === currentDialogParentId) {
        // Update the dialog with the new state
        const newParentData = updatedFiles.find(f => f.id === currentDialogParentId);
        const newVersionsData = updatedFiles.filter(f => f.parent_media_id === currentDialogParentId);
        
        if (newParentData) {
          const currentVersionData = newVersionsData.find(v => v.is_current_version) || newParentData;
          
          const updatedDialogMedia = {
            ...versionManagerDialog.media,
            versions: newVersionsData,
            currentVersion: currentVersionData,
          };
          
          setVersionManagerDialog({
            open: true,
            media: updatedDialogMedia,
            isUpdating: false,
          });
        }
      }
    }

    toast({
      title: "Version Deleted",
      description: "Version has been deleted",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Failed to Delete Version",
      description: result.error,
      variant: "destructive",
    });
  }
};
  const handleOpenVersionManager = (media: OrganizedMedia) => {
    setVersionManagerDialog({
      open: true,
      media,
      isUpdating: false,
    });
  };

  const handleStatusChange = async (
    mediaFile: MediaFile,
    newStatus: string
  ) => {
    const result = await updateMediaStatusAction(mediaFile.id, newStatus);

    if (result.success) {
      // Update the local state
      const updatedFiles = mediaFiles.map((file) =>
        file.id === mediaFile.id ? { ...file, status: newStatus } : file
      );
      onMediaUpdated(updatedFiles);

      toast({
        title: "Status Updated",
        description: `Media status changed to ${newStatus.replace("_", " ")}`,
        variant: "teal",
      });
    } else {
      toast({
        title: "Failed to Update Status",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col text-white">
      {/* Project Header & Actions */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex justify-end items-center gap-3">
          {/* Upload Button */}
          <Button
            onClick={() =>
              userPermissions.canUpload &&
              uploadStatus?.canUpload &&
              document.getElementById("file-input")?.click()
            }
            disabled={
              !userPermissions.canUpload ||
              isUploading ||
              !uploadStatus?.canUpload ||
              isLoadingLimits
            }
            className="flex-1 sm:flex-none flex items-center gap-2"
            size="sm"
            title={
              !userPermissions.canUpload
                ? "You need collaborator permissions to upload media"
                : !uploadStatus?.canUpload
                  ? uploadStatus?.reason
                  : isUploading
                    ? "Upload in progress..."
                    : isLoadingLimits
                      ? "Loading upload limits..."
                      : "Upload media files"
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : !uploadStatus?.canUpload ? (
              <>
                <Crown className="h-4 w-4" />
                Upgrade Storage
              </>
            ) : isLoadingLimits ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Media
              </>
            )}
          </Button>

          {/* References Button */}
          <Button
            onClick={() => setReferencesDialog({ open: true })}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Link2 className="h-4 w-4" />
            References
          </Button>

          {/* Hidden file input */}
          {userPermissions.canUpload && (
                    <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="video/mp4,video/mov, image/svg+xml,video/avi,video/mkv,video/webm,image/jpg,image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac,audio/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isUploading || !uploadStatus?.canUpload || isLoadingLimits}
                   />

          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Uploading files...</span>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {organizedMedia.length === 0 ? (
          <div className="text-center py-12">
            <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg">No media files</p>
            <p className="text-sm text-muted-foreground">
              Upload videos or images to get started
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                organizedMedia.length === 1
                  ? "repeat(auto-fit, minmax(330px, 450px))"
                  : "repeat(auto-fit, minmax(330px, 1fr))",
              width: "100%",
            }}
          >
            {organizedMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                selectedMedia={selectedMedia}
                expandedMedia={expandedMedia}
                draggedOver={draggedOver}
                draggedMedia={draggedMedia}
                projectId={projectId}
                onMediaSelect={onMediaSelect}
                onExpandToggle={(mediaId) => {
                  const newExpanded = new Set(expandedMedia);
                  if (expandedMedia.has(mediaId)) {
                    newExpanded.delete(mediaId);
                  } else {
                    newExpanded.add(mediaId);
                  }
                  setExpandedMedia(newExpanded);
                }}
                onDragStart={(media) => setDraggedMedia(media)}
                onDragEnd={() => setDraggedMedia(null)}
                onDragOver={(mediaId) => setDraggedOver(mediaId)}
                onDragLeave={() => setDraggedOver(null)}
                onDrop={(targetId, files) => {
                  if (files.length > 0) {
                    // Check if validator is ready and validate files
                    if (!uploadValidator) {
                      toast({
                        title: "Upload Error",
                        description:
                          "Upload system not ready. Please try again.",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (!uploadValidator.canUploadFiles(files)) {
                      uploadValidator.showUploadError(files);
                      return;
                    }

                    uploadFilesHandler(files, targetId);
                  } else if (draggedMedia) {
                    handleCreateVersion(targetId, draggedMedia.id);
                  }
                  setDraggedOver(null);
                  setDraggedMedia(null);
                }}
                onVersionReorder={handleVersionReorder}
                onCreateReviewLink={(mediaFile) =>
                  setCreateLinkDialog({
                    open: true,
                    mediaFile,
                    isCreating: false,
                    showSuccess: false,
                  })
                }
                onViewReviewLinks={handleViewReviewLinks}
                onManageReviewLinks={handleManageReviewLinks}
                onDeleteMedia={(mediaFile) =>
                  setDeleteDialog({
                    open: true,
                    mediaFile,
                    isDeleting: false,
                  })
                }
                onOpenVersionManager={handleOpenVersionManager}
                onStatusChange={handleStatusChange}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project References Dialog */}
      <ProjectReferencesDialog
        open={referencesDialog.open}
        onOpenChange={(open) => setReferencesDialog({ open })}
        projectReferences={project.project_references || []}
        projectName={project.name}
      />

      {/* Media Dialogs */}
      <MediaDialogs
        createLinkDialog={createLinkDialog}
        viewLinksDialog={viewLinksDialog}
        manageLinksDialog={manageLinksDialog}
        versionManagerDialog={versionManagerDialog}
        deleteDialog={deleteDialog}
        onCreateLinkDialogChange={setCreateLinkDialog}
        onViewLinksDialogChange={setViewLinksDialog}
        onManageLinksDialogChange={setManageLinksDialog}
        onVersionManagerDialogChange={setVersionManagerDialog}
        onDeleteDialogChange={setDeleteDialog}
        onCreateReviewLink={handleCreateReviewLink}
        onToggleReviewLink={handleToggleReviewLink}
        onUpdateReviewLink={handleUpdateReviewLink}
        onDeleteReviewLink={handleDeleteReviewLink}
        onVersionReorder={handleVersionReorder}
        onUpdateVersionName={handleUpdateVersionName}
        onDeleteVersion={handleDeleteVersion}
        onDeleteMedia={handleDeleteMedia}
        projectId={projectId}
        onMediaUpdated={onMediaUpdated}
      />
      {/* Global drag message */}
      {draggedMedia && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          Drag to another media to create a version
        </div>
      )}
    </div>
  );
}
