// app/dashboard/projects/[id]/components/media/MediaGrid.tsx

"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, FileVideo } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { MediaCard } from "./MediaCard";
import { MediaDialogs } from "./MediaDialogs";
import {
  deleteMediaAction,
  createReviewLinkAction,
  getReviewLinksAction,
  toggleReviewLinkAction,
  updateReviewLinkAction,
  deleteReviewLinkAction,
  reorderVersionsAction,
  updateVersionNameAction,
  deleteVersionAction,
  addVersionToMediaAction,
} from "../../lib/actions";
import {
  MediaFile,
  OrganizedMedia,
  ReviewLink,
} from "@/app/dashboard/lib/types";

interface MediaGridProps {
  mediaFiles: MediaFile[];
  reviewLinks: ReviewLink[];
  selectedMedia: MediaFile | null;
  onMediaSelect: (media: MediaFile) => void;
  onMediaUpdated: (newFiles: MediaFile[]) => void;
  onReviewLinksUpdated: (newLinks: ReviewLink[]) => void;
  projectId: string;
}

export function MediaGrid({
  mediaFiles,
  reviewLinks,
  selectedMedia,
  onMediaSelect,
  onMediaUpdated,
  onReviewLinksUpdated,
  projectId,
}: MediaGridProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());
  const [draggedMedia, setDraggedMedia] = useState<MediaFile | null>(null);

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

  // Calculate project size
  const projectSize = React.useMemo(() => {
    const totalBytes = mediaFiles.reduce(
      (sum, file) => sum + file.file_size,
      0
    );
    const maxBytes = 2 * 1024 * 1024 * 1024; // 2GB

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return {
      current: totalBytes,
      max: maxBytes,
      currentFormatted: formatBytes(totalBytes),
      maxFormatted: formatBytes(maxBytes),
      percentage: (totalBytes / maxBytes) * 100,
      remaining: maxBytes - totalBytes,
      remainingFormatted: formatBytes(maxBytes - totalBytes),
    };
  }, [mediaFiles]);

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

  // Check if files can be uploaded
  const canUploadFiles = (files: File[]) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return projectSize.remaining >= totalSize;
  };

  // Upload files function
  const uploadFiles = async (files: File[], targetMediaId?: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      if (targetMediaId) {
        formData.append("parentMediaId", targetMediaId);
      }

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", `/api/projects/${projectId}/media`);
        xhr.send(formData);
      });

      const result = (await uploadPromise) as any;
      const newFiles = [...mediaFiles, ...result.files];
      onMediaUpdated(newFiles);

      if (targetMediaId) {
        setExpandedMedia((prev) => new Set(prev).add(targetMediaId));
      }

      toast({
        title: "Success",
        description: targetMediaId
          ? `Added ${result.files.length} new version(s)`
          : result.message,
        variant: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload files",
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

      // Check if upload would exceed project size limit
      if (!canUploadFiles(acceptedFiles)) {
        const uploadSize = acceptedFiles.reduce(
          (sum, file) => sum + file.size,
          0
        );
        const formatBytes = (bytes: number) => {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
          );
        };

        toast({
          title: "Upload Too Large",
          description: `Upload size (${formatBytes(uploadSize)}) would exceed project limit. Available space: ${projectSize.remainingFormatted}`,
          variant: "destructive",
        });
        return;
      }

      if (draggedOver) {
        await uploadFiles(acceptedFiles, draggedOver);
      } else {
        await uploadFiles(acceptedFiles);
      }
    },
    [draggedOver, projectSize.remaining]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading || projectSize.percentage >= 100,
    maxSize: 1024 * 1024 * 1024,
    noClick: false,
  });

  // Action handlers
  const handleVersionReorder = async (
    parentId: string,
    reorderedVersions: MediaFile[]
  ) => {
    const result = await reorderVersionsAction(parentId, reorderedVersions);

    if (result.success) {
      // Update the mediaFiles state with new version numbers and current version
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
        variant: "success",
      });
    } else {
      toast({
        title: "Failed to Reorder Versions",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleCreateVersion = async (
    targetMediaId: string,
    sourceMediaId: string
  ) => {
    try {
      const result = await addVersionToMediaAction(
        targetMediaId,
        sourceMediaId
      );

      if (result.success) {
        const newFiles = mediaFiles.map((file) => {
          if (file.id === sourceMediaId) {
            return {
              ...file,
              parent_media_id: targetMediaId,
              version_number: result.versionNumber,
              is_current_version: true,
            };
          }
          if (file.id === targetMediaId) {
            return {
              ...file,
              is_current_version: false,
            };
          }
          if (file.parent_media_id === targetMediaId) {
            return {
              ...file,
              is_current_version: false,
            };
          }
          return file;
        });

        onMediaUpdated(newFiles);
        setExpandedMedia((prev) => new Set(prev).add(targetMediaId));

        const targetName = mediaFiles.find(
          (m) => m.id === targetMediaId
        )?.original_filename;
        const sourceName = mediaFiles.find(
          (m) => m.id === sourceMediaId
        )?.original_filename;

        toast({
          title: "Version Created",
          description: `"${sourceName}" is now version ${result.versionNumber} of "${targetName}"`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to Create Version",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create version relationship",
        variant: "destructive",
      });
    }
  };

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
        variant: "success",
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
        variant: "success",
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
        variant: "success",
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
        variant: "success",
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
        variant: "success",
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

  return (
    <div className="h-full flex flex-col text-white">
      {/* Project Size Indicator & Upload Area */}
      <div className="p-4 border-b flex-shrink-0">
        {/* Project Size Indicator */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">
              Project Storage
            </span>
            <span className="text-xs text-muted-foreground">
              {projectSize.currentFormatted} / {projectSize.maxFormatted}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                projectSize.percentage > 90
                  ? "bg-red-500"
                  : projectSize.percentage > 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(projectSize.percentage, 100)}%` }}
            />
          </div>
          {projectSize.percentage > 90 && (
            <p className="text-xs text-red-400 mt-1">
              Warning: Project is almost full ({projectSize.remainingFormatted}{" "}
              remaining)
            </p>
          )}
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-primary bg-primary/10"
                : projectSize.percentage >= 100
                  ? "border-red-500/50 bg-red-500/10"
                  : "hover:border-white/30"
            }
            ${isUploading || projectSize.percentage >= 100 ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          {projectSize.percentage >= 100 ? (
            <div className="space-y-2">
              <Upload className="h-5 w-5 mx-auto text-red-500" />
              <div>
                <p className="text-xs font-medium text-red-400">Project Full</p>
                <p className="text-xs text-muted-foreground">
                  Delete some files to upload more
                </p>
              </div>
            </div>
          ) : isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">
                  Uploading... {uploadProgress}%
                </p>
                <Progress
                  value={uploadProgress}
                  className="w-full max-w-md mx-auto h-1"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop or click"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Drag onto media to create versions
                </p>
                <div className="text-xs text-muted-foreground">
                  <p>Supports: MP4, MOV, AVI, MKV, WebM videos</p>
                  <p>JPG, PNG, GIF, WebP images</p>
                  <p className="font-medium">Maximum: 1GB per file</p>
                  <p className="font-medium text-green-400">
                    Available: {projectSize.remainingFormatted}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {organizedMedia.length === 0 ? (
          <div className="text-center py-12">
            <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
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
                "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
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
                    // Check size limit before dropping files
                    if (!canUploadFiles(files)) {
                      const uploadSize = files.reduce(
                        (sum, file) => sum + file.size,
                        0
                      );
                      const formatBytes = (bytes: number) => {
                        if (bytes === 0) return "0 Bytes";
                        const k = 1024;
                        const sizes = ["Bytes", "KB", "MB", "GB"];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return (
                          parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
                          " " +
                          sizes[i]
                        );
                      };
                      toast({
                        title: "Upload Too Large",
                        description: `Upload size (${formatBytes(uploadSize)}) would exceed project limit. Available space: ${projectSize.remainingFormatted}`,
                        variant: "destructive",
                      });
                      return;
                    }
                    uploadFiles(files, targetId);
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
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
