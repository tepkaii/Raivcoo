// app/dashboard/projects/[id]/components/Media/MediaGrid.tsx
// @ts-nocheck
// @ts-ignore
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

    // First pass: identify parent media and group versions
    mediaFiles.forEach((file) => {
      if (!file.parent_media_id) {
        parentMediaMap.set(file.id, file);
        if (!childVersionsMap.has(file.id)) {
          childVersionsMap.set(file.id, []);
        }
      } else {
        if (!childVersionsMap.has(file.parent_media_id)) {
          childVersionsMap.set(file.parent_media_id, []);
        }
        childVersionsMap.get(file.parent_media_id)!.push(file);
      }
    });

    // Second pass: create organized structure
    const result: OrganizedMedia[] = [];

    parentMediaMap.forEach((parentMedia, parentId) => {
      const versions = childVersionsMap.get(parentId) || [];
      const sortedVersions = versions.sort(
        (a, b) => a.version_number - b.version_number
      );

      // Find current version
      let currentVersion = parentMedia;
      if (parentMedia.is_current_version) {
        currentVersion = parentMedia;
      } else {
        const currentVersionFromChildren = sortedVersions.find(
          (v) => v.is_current_version
        );
        if (currentVersionFromChildren) {
          currentVersion = currentVersionFromChildren;
        }
      }

      // Check if this parent media has review links
      const hasReviewLinks = reviewLinks.some(
        (link) => link.media_id === parentId
      );

      result.push({
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
        versions: sortedVersions,
        currentVersion: currentVersion,
        hasReviewLinks,
      });
    });

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
        description:
          "Upload validator not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await performUpload(
        files,
        projectId,
        uploadValidator,
        targetMediaId,
        setUploadProgress
      );

      if (result.success && result.files) {
        const newFiles = [...mediaFiles, ...result.files];
        onMediaUpdated(newFiles);

        if (targetMediaId) {
          setExpandedMedia((prev) => new Set(prev).add(targetMediaId));
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
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
        // ✅ 1. IMMEDIATE OPTIMISTIC UPDATE (0ms delay)
        const draggedMedia = mediaFiles.find((m) => m.id === sourceMediaId);
        if (!draggedMedia) {
          throw new Error("Source media not found");
        }

        const sourceParentId = draggedMedia.parent_media_id || draggedMedia.id;
        const sourceGroup = mediaFiles.filter(
          (m) => m.id === sourceParentId || m.parent_media_id === sourceParentId
        );

        const currentVersion = sourceGroup.find((m) => m.is_current_version);
        const mediaToMoveId = currentVersion?.id || sourceMediaId;
        const mediaToMove = mediaFiles.find((m) => m.id === mediaToMoveId);

        if (!mediaToMove) {
          throw new Error("Media to move not found");
        }

        // Get target group info
        const targetGroup = mediaFiles.filter(
          (m) => m.id === targetMediaId || m.parent_media_id === targetMediaId
        );
        const nextVersionNumber =
          Math.max(...targetGroup.map((m) => m.version_number)) + 1;

        // ✅ Calculate optimistic state
        const optimisticFiles = mediaFiles.map((file) => {
          if (file.id === mediaToMoveId) {
            return {
              ...file,
              parent_media_id: targetMediaId,
              version_number: nextVersionNumber,
              is_current_version: true,
            };
          }

          if (targetGroup.some((m) => m.id === file.id)) {
            return {
              ...file,
              is_current_version: false,
            };
          }

          // Reorganize source group logic...
          if (
            mediaToMoveId !== sourceParentId &&
            sourceGroup.some((m) => m.id === file.id)
          ) {
            const remainingInSource = sourceGroup.filter(
              (m) => m.id !== mediaToMoveId
            );

            if (remainingInSource.length > 0) {
              const newParent = remainingInSource.reduce((lowest, current) =>
                current.version_number < lowest.version_number
                  ? current
                  : lowest
              );

              if (file.id === newParent.id) {
                return {
                  ...file,
                  parent_media_id: null,
                  version_number: 1,
                  is_current_version: true,
                };
              } else {
                const otherVersions = remainingInSource.filter(
                  (m) => m.id !== newParent.id
                );
                const newVersionNumber =
                  otherVersions.findIndex((m) => m.id === file.id) + 2;

                if (newVersionNumber > 1) {
                  return {
                    ...file,
                    parent_media_id: newParent.id,
                    version_number: newVersionNumber,
                    is_current_version: false,
                  };
                }
              }
            }
          }

          return file;
        });

        // ✅ Apply optimistic update immediately
        onMediaUpdated(optimisticFiles);
        setExpandedMedia((prev) => new Set(prev).add(targetMediaId));

        // ✅ 2. DIRECT SUPABASE CALLS (much faster than server actions)
        const supabase = createClient();

        // Build all updates as a batch
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

        // Set target group to not current
        updates.push(
          supabase
            .from("project_media")
            .update({ is_current_version: false })
            .in(
              "id",
              targetGroup.map((m) => m.id)
            )
        );

        // Handle source group reorganization if needed
        if (mediaToMoveId !== sourceParentId) {
          const remainingInSource = sourceGroup.filter(
            (m) => m.id !== mediaToMoveId
          );

          if (remainingInSource.length > 0) {
            const newParent = remainingInSource.reduce((lowest, current) =>
              current.version_number < lowest.version_number ? current : lowest
            );

            // Make new parent
            updates.push(
              supabase
                .from("project_media")
                .update({
                  parent_media_id: null,
                  version_number: 1,
                  is_current_version: true,
                })
                .eq("id", newParent.id)
            );

            // Update other versions
            const otherVersions = remainingInSource.filter(
              (m) => m.id !== newParent.id
            );
            otherVersions.forEach((version, index) => {
              updates.push(
                supabase
                  .from("project_media")
                  .update({
                    parent_media_id: newParent.id,
                    version_number: index + 2,
                    is_current_version: false,
                  })
                  .eq("id", version.id)
              );
            });
          }
        }

        // ✅ Execute all updates in parallel (fastest approach)
        const results = await Promise.allSettled(updates);

        // Check for any failures
        const failures = results.filter(
          (result) => result.status === "rejected"
        );
        if (failures.length > 0) {
          console.error("Some updates failed:", failures);
          throw new Error(`${failures.length} database updates failed`);
        }

        // ✅ Success - keep optimistic update
        const movedMediaName = mediaToMove.original_filename;
        const targetName = mediaFiles.find(
          (m) => m.id === targetMediaId
        )?.original_filename;

        toast({
          title: "Version Created",
          description: `"${movedMediaName}" is now a version of "${targetName}"`,
          variant: "green",
        });
      } catch (error) {
        console.error("Error in handleCreateVersion:", error);

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

    const result = await deleteMediaAction(projectId, mediaFile.id);

    if (result.success) {
      let updatedFiles = mediaFiles.filter((file) => file.id !== mediaFile.id);
      onMediaUpdated(updatedFiles);

      // Also remove any review links for this media
      const updatedLinks = reviewLinks.filter(
        (link) => link.media_id !== mediaFile.id
      );
      onReviewLinksUpdated(updatedLinks);

      toast({
        title: "Media Deleted",
        description: "Media file has been permanently deleted",
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
      const updatedFiles = mediaFiles.filter((file) => file.id !== versionId);
      onMediaUpdated(updatedFiles);

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
              accept="video/mp4,video/mov,video/avi,video/mkv,video/webm,image/jpg,image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={
                isUploading || !uploadStatus?.canUpload || isLoadingLimits
              }
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
