"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileVideo,
  Image as ImageIcon,
  MoreVertical,
  Link,
  Eye,
  Trash2,
  Copy,
  Loader2,
  Download,
  ExternalLink,
  Share,
  Check,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  deleteMediaAction,
  createReviewLinkAction,
  getReviewLinksAction,
  toggleReviewLinkAction,
  setCurrentVersionAction,
  addVersionToMediaAction,
} from "./media-actions";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
}

interface ReviewLink {
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  media_id: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_media: MediaFile[];
}

interface MediaWorkspaceProps {
  project: Project;
}

interface OrganizedMedia {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  version_number: number;
  is_current_version: boolean;
  versions: MediaFile[];
  currentVersion: MediaFile;
}

export function MediaWorkspace({ project }: MediaWorkspaceProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());
  const [draggedMedia, setDraggedMedia] = useState<MediaFile | null>(null);

  // Create review link dialog state
  const [createLinkDialog, setCreateLinkDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  }>({ open: false, isCreating: false, showSuccess: false });

  // View review links dialog state
  const [viewLinksDialog, setViewLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }>({ open: false, links: [], isLoading: false });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  }>({ open: false, isDeleting: false });

  // Organize media files into hierarchical structure
  const organizedMedia = React.useMemo((): OrganizedMedia[] => {
    const parentMediaMap = new Map<string, MediaFile>();
    const childVersionsMap = new Map<string, MediaFile[]>();

    // First pass: identify parent media and group versions
    mediaFiles.forEach((file) => {
      if (!file.parent_media_id) {
        // This is a parent media
        parentMediaMap.set(file.id, file);
        if (!childVersionsMap.has(file.id)) {
          childVersionsMap.set(file.id, []);
        }
      } else {
        // This is a version
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

      // Sort versions by version_number descending (newest first)
      const sortedVersions = versions.sort(
        (a, b) => b.version_number - a.version_number
      );

      // Find current version (could be parent or any version)
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
        versions: sortedVersions,
        currentVersion: currentVersion,
      });
    });

    // Sort by upload date (newest first)
    return result.sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  }, [mediaFiles]);

  // Helper function to renumber versions after deletion
  const renumberVersions = (parentId: string, remainingFiles: MediaFile[]) => {
    const parentMedia = remainingFiles.find((f) => f.id === parentId);
    const versions = remainingFiles.filter(
      (f) => f.parent_media_id === parentId
    );

    if (!parentMedia) return remainingFiles;

    // Sort versions by upload date (oldest first for renumbering)
    const sortedVersions = versions.sort(
      (a, b) =>
        new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    );

    // Renumber: parent is always v1, then versions are v2, v3, etc.
    return remainingFiles.map((file) => {
      if (file.id === parentId) {
        return { ...file, version_number: 1 };
      }
      if (file.parent_media_id === parentId) {
        const index = sortedVersions.findIndex((v) => v.id === file.id);
        return { ...file, version_number: index + 2 }; // +2 because parent is v1
      }
      return file;
    });
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

        xhr.open("POST", `/api/projects/${project.id}/media`);
        xhr.send(formData);
      });

      const result = (await uploadPromise) as any;

      setMediaFiles((prev) => [...prev, ...result.files]);

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

      if (draggedOver) {
        await uploadFiles(acceptedFiles, draggedOver);
      } else {
        await uploadFiles(acceptedFiles);
      }
    },
    [draggedOver]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading,
    maxSize: 200 * 1024 * 1024,
    noClick: false,
  });

  const handleDragStart = (e: React.DragEvent, media: MediaFile) => {
    e.dataTransfer.setData("application/json", JSON.stringify(media));
    e.dataTransfer.effectAllowed = "copy";
    setDraggedMedia(media);
  };

  const handleDragOver = (e: React.DragEvent, mediaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    if (e.dataTransfer.types.includes("Files") || draggedMedia) {
      setDraggedOver(mediaId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, mediaId: string) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (draggedOver === mediaId) {
        setDraggedOver(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, targetMediaId: string) => {
    e.preventDefault();
    setDraggedOver(null);

    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const allowedTypes = [
        "video/mp4",
        "video/mov",
        "video/avi",
        "video/mkv",
        "video/webm",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      const validFiles = files.filter((file) =>
        allowedTypes.includes(file.type)
      );

      if (validFiles.length > 0) {
        uploadFiles(validFiles, targetMediaId);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload videos or images only",
          variant: "destructive",
        });
      }
      return;
    }

    if (draggedMedia) {
      if (
        draggedMedia.id === targetMediaId ||
        draggedMedia.parent_media_id === targetMediaId
      ) {
        toast({
          title: "Invalid Drop",
          description: "Cannot create version from the same media",
          variant: "destructive",
        });
        setDraggedMedia(null);
        return;
      }

      const targetMedia = mediaFiles.find((m) => m.id === targetMediaId);
      if (
        targetMedia &&
        draggedMedia.versions?.some((v) => v.id === targetMediaId)
      ) {
        toast({
          title: "Invalid Drop",
          description: "Cannot drop parent media onto its own version",
          variant: "destructive",
        });
        setDraggedMedia(null);
        return;
      }

      try {
        const result = await addVersionToMediaAction(
          targetMediaId,
          draggedMedia.id
        );

        if (result.success) {
          setMediaFiles((prev) =>
            prev.map((file) => {
              if (file.id === draggedMedia.id) {
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
            })
          );

          setExpandedMedia((prev) => new Set(prev).add(targetMediaId));

          const targetName = mediaFiles.find(
            (m) => m.id === targetMediaId
          )?.original_filename;
          toast({
            title: "Version Created",
            description: `"${draggedMedia.original_filename}" is now version ${result.versionNumber} of "${targetName}"`,
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

      setDraggedMedia(null);
    }
  };

  const handleSetCurrentVersion = async (
    parentId: string,
    versionId: string
  ) => {
    const result = await setCurrentVersionAction(parentId, versionId);

    if (result.success) {
      setMediaFiles((prev) =>
        prev.map((file) => ({
          ...file,
          is_current_version:
            file.parent_media_id === parentId || file.id === parentId
              ? file.id === versionId
              : file.is_current_version,
        }))
      );

      toast({
        title: "Current Version Updated",
        description: "The current version has been changed",
        variant: "success",
      });
    } else {
      toast({
        title: "Failed to Update Version",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleCreateReviewLink = async (
    mediaFile: MediaFile,
    title: string
  ) => {
    setCreateLinkDialog((prev) => ({ ...prev, isCreating: true }));

    const result = await createReviewLinkAction(
      project.id,
      mediaFile.id,
      title
    );

    if (result.success) {
      try {
        await navigator.clipboard.writeText(result.reviewUrl!);
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }

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

    const result = await getReviewLinksAction(project.id, mediaFile.id);

    if (result.success) {
      setViewLinksDialog((prev) => ({
        ...prev,
        links: result.links,
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

  const handleDeleteMedia = async (mediaFile: MediaFile) => {
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    const result = await deleteMediaAction(project.id, mediaFile.id);

    if (result.success) {
      setMediaFiles((prev) => {
        let updatedFiles = prev.filter((file) => file.id !== mediaFile.id);

        // If we deleted a version, renumber the remaining versions
        if (mediaFile.parent_media_id) {
          updatedFiles = renumberVersions(
            mediaFile.parent_media_id,
            updatedFiles
          );
        }

        return updatedFiles;
      });

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

  const handleCopyReviewLink = async (linkToken: string) => {
    const reviewUrl = `${window.location.origin}/review/${linkToken}`;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      toast({
        title: "Link Copied",
        description: "Review link copied to clipboard",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleToggleReviewLink = async (
    linkId: string,
    currentStatus: boolean
  ) => {
    const result = await toggleReviewLinkAction(linkId, !currentStatus);

    if (result.success) {
      setViewLinksDialog((prev) => ({
        ...prev,
        links: prev.links.map((link) =>
          link.id === linkId ? { ...link, is_active: !currentStatus } : link
        ),
      }));

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReviewUrl = (linkToken: string) => {
    return `${window.location.origin}/review/${linkToken}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${isUploading ? "pointer-events-none opacity-50" : "hover:border-primary/50"}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Uploading files... {uploadProgress}%
                  </p>
                  <Progress
                    value={uploadProgress}
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop files here"
                      : "Drag & drop files here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: Videos (MP4, MOV, AVI, MKV, WebM) and Images (JPG,
                    PNG, GIF, WebP)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 200MB per file
                  </p>
                  <p className="text-xs text-primary font-medium mt-3">
                    💡 Tip: Use the drag handle (⋮⋮) in media actions to drag
                    items, or drag files onto media to create versions
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Media Files ({organizedMedia.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizedMedia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No media files uploaded yet</p>
              <p className="text-sm">
                Start by uploading some videos or images
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizedMedia.map((media) => {
                const hasVersions = media.versions.length > 0;
                const isExpanded = expandedMedia.has(media.id);
                const isDropTarget = draggedOver === media.id;
                const totalVersions = hasVersions
                  ? media.versions.length + 1
                  : 1; // +1 for parent

                return (
                  <div key={media.id} className="space-y-2">
                    {/* Main Media Item - Always shows current version */}
                    <Card
                      className={`overflow-hidden transition-all ${
                        isDropTarget
                          ? "ring-2 ring-primary bg-primary/5 scale-[1.02]"
                          : ""
                      }`}
                      onDragOver={(e) => handleDragOver(e, media.id)}
                      onDragLeave={(e) => handleDragLeave(e, media.id)}
                      onDrop={(e) => handleDrop(e, media.id)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4 p-4">
                        {/* Thumbnail - Shows current version */}
                        <div className="aspect-video bg-muted rounded overflow-hidden relative">
                          {media.currentVersion.file_type === "image" ? (
                            <img
                              src={media.currentVersion.r2_url}
                              alt={media.currentVersion.original_filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.currentVersion.r2_url}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                              preload="metadata"
                            />
                          )}

                          {/* Current version indicator */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" className="text-xs">
                              v{media.currentVersion.version_number} (Current)
                            </Badge>
                          </div>

                          {/* File type badge */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {media.currentVersion.file_type === "video" ? (
                                <FileVideo className="h-3 w-3" />
                              ) : (
                                <ImageIcon className="h-3 w-3" />
                              )}
                              {media.currentVersion.file_type}
                            </Badge>
                          </div>

                          {/* Drop overlay */}
                          {isDropTarget && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add as new version
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3
                                className="font-medium truncate"
                                title={media.original_filename}
                              >
                                {media.original_filename}
                              </h3>
                              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                <p>
                                  {formatFileSize(
                                    media.currentVersion.file_size
                                  )}
                                </p>
                                <p>
                                  {formatDate(media.currentVersion.uploaded_at)}
                                </p>
                                {hasVersions && (
                                  <p className="text-primary font-medium">
                                    {totalVersions} versions available
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Expand/Collapse versions */}
                              {hasVersions && (
                                <RevButtons
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedMedia);
                                    if (isExpanded) {
                                      newExpanded.delete(media.id);
                                    } else {
                                      newExpanded.add(media.id);
                                    }
                                    setExpandedMedia(newExpanded);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </RevButtons>
                              )}

                              {/* Actions dropdown */}
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <RevButtons variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </RevButtons>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <div
                                      className="flex items-center w-full cursor-grab active:cursor-grabbing"
                                      draggable
                                      onDragStart={(e) =>
                                        handleDragStart(e, media.currentVersion)
                                      }
                                      onDragEnd={() => setDraggedMedia(null)}
                                    >
                                      <GripVertical className="h-4 w-4 mr-2" />
                                      Drag to Create Version
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(
                                        media.currentVersion.r2_url,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Full Size
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setCreateLinkDialog({
                                        open: true,
                                        mediaFile: media.currentVersion,
                                        isCreating: false,
                                        showSuccess: false,
                                      })
                                    }
                                  >
                                    <Link className="h-4 w-4 mr-2" />
                                    Create Review Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewReviewLinks(
                                        media.currentVersion
                                      )
                                    }
                                  >
                                    <Share className="h-4 w-4 mr-2" />
                                    View Review Links
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={media.currentVersion.r2_url}
                                      download={
                                        media.currentVersion.original_filename
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Current
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      setDeleteDialog({
                                        open: true,
                                        mediaFile: media.currentVersion,
                                        isDeleting: false,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Versions (Collapsible) - Show parent as v1 and versions in descending order */}
                    {hasVersions && isExpanded && (
                      <div className="ml-4 space-y-2">
                        {/* Show parent as v1 first */}
                        <Card
                          className={`bg-muted/50 transition-all ${
                            draggedOver === media.id
                              ? "ring-2 ring-primary bg-primary/5"
                              : ""
                          }`}
                          onDragOver={(e) => handleDragOver(e, media.id)}
                          onDragLeave={(e) => handleDragLeave(e, media.id)}
                          onDrop={(e) => handleDrop(e, media.id)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-[120px,1fr] gap-3 p-3">
                            {/* Parent thumbnail */}
                            <div className="aspect-video bg-muted rounded overflow-hidden relative">
                              {media.file_type === "image" ? (
                                <img
                                  src={media.r2_url}
                                  alt={media.original_filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={media.r2_url}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                  muted
                                  preload="metadata"
                                />
                              )}

                              <div className="absolute top-1 left-1">
                                <Badge
                                  variant={
                                    media.is_current_version
                                      ? "default"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  v1 (Original)
                                </Badge>
                              </div>

                              {/* Drop overlay for parent */}
                              {draggedOver === media.id && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    Add Version
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Parent details */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className="text-sm font-medium truncate"
                                      title={media.original_filename}
                                    >
                                      {media.original_filename}
                                    </h4>
                                    {media.is_current_version && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        <Star className="h-3 w-3 mr-1" />
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <p>
                                      {formatFileSize(media.file_size)} •{" "}
                                      {formatDate(media.uploaded_at)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!media.is_current_version && (
                                    <RevButtons
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSetCurrentVersion(
                                          media.id,
                                          media.id
                                        )
                                      }
                                    >
                                      <Star className="h-3 w-3 mr-1" />
                                      Set Current
                                    </RevButtons>
                                  )}
                                  <RevButtons
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(media.r2_url, "_blank")
                                    }
                                  >
                                    <Eye className="h-3 w-3" />
                                  </RevButtons>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <RevButtons variant="outline" size="sm">
                                        <MoreVertical className="h-3 w-3" />
                                      </RevButtons>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <div
                                          className="flex items-center w-full cursor-grab active:cursor-grabbing"
                                          draggable
                                          onDragStart={(e) =>
                                            handleDragStart(e, {
                                              id: media.id,
                                              filename: media.filename,
                                              original_filename:
                                                media.original_filename,
                                              file_type: media.file_type,
                                              mime_type: media.mime_type,
                                              file_size: media.file_size,
                                              r2_url: media.r2_url,
                                              uploaded_at: media.uploaded_at,
                                              version_number:
                                                media.version_number,
                                              is_current_version:
                                                media.is_current_version,
                                            })
                                          }
                                          onDragEnd={() =>
                                            setDraggedMedia(null)
                                          }
                                        >
                                          <GripVertical className="h-4 w-4 mr-2" />
                                          Drag to Create Version
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={media.r2_url}
                                          download={media.original_filename}
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setDeleteDialog({
                                            open: true,
                                            mediaFile: {
                                              id: media.id,
                                              filename: media.filename,
                                              original_filename:
                                                media.original_filename,
                                              file_type: media.file_type,
                                              mime_type: media.mime_type,
                                              file_size: media.file_size,
                                              r2_url: media.r2_url,
                                              uploaded_at: media.uploaded_at,
                                              version_number:
                                                media.version_number,
                                              is_current_version:
                                                media.is_current_version,
                                            },
                                            isDeleting: false,
                                          })
                                        }
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Original
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Show versions (newest first) */}
                        {media.versions.map((version) => (
                          <Card
                            key={version.id}
                            className={`bg-muted/50 transition-all ${
                              draggedOver === version.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : ""
                            }`}
                            onDragOver={(e) => handleDragOver(e, version.id)}
                            onDragLeave={(e) => handleDragLeave(e, version.id)}
                            onDrop={(e) => handleDrop(e, version.id)}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-[120px,1fr] gap-3 p-3">
                              {/* Version thumbnail */}
                              <div className="aspect-video bg-muted rounded overflow-hidden relative">
                                {version.file_type === "image" ? (
                                  <img
                                    src={version.r2_url}
                                    alt={version.original_filename}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={version.r2_url}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                    muted
                                    preload="metadata"
                                  />
                                )}

                                <div className="absolute top-1 left-1">
                                  <Badge
                                    variant={
                                      version.is_current_version
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    v{version.version_number}
                                  </Badge>
                                </div>

                                {/* Drop overlay for versions */}
                                {draggedOver === version.id && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      Add Version
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Version details */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4
                                        className="text-sm font-medium truncate"
                                        title={version.original_filename}
                                      >
                                        {version.original_filename}
                                      </h4>
                                      {version.is_current_version && (
                                        <Badge
                                          variant="default"
                                          className="text-xs"
                                        >
                                          <Star className="h-3 w-3 mr-1" />
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <p>
                                        {formatFileSize(version.file_size)} •{" "}
                                        {formatDate(version.uploaded_at)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {!version.is_current_version && (
                                      <RevButtons
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSetCurrentVersion(
                                            media.id,
                                            version.id
                                          )
                                        }
                                      >
                                        <Star className="h-3 w-3 mr-1" />
                                        Set Current
                                      </RevButtons>
                                    )}
                                    <RevButtons
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(version.r2_url, "_blank")
                                      }
                                    >
                                      <Eye className="h-3 w-3" />
                                    </RevButtons>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <RevButtons variant="outline" size="sm">
                                          <MoreVertical className="h-3 w-3" />
                                        </RevButtons>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <div
                                            className="flex items-center w-full cursor-grab active:cursor-grabbing"
                                            draggable
                                            onDragStart={(e) =>
                                              handleDragStart(e, version)
                                            }
                                            onDragEnd={() =>
                                              setDraggedMedia(null)
                                            }
                                          >
                                            <GripVertical className="h-4 w-4 mr-2" />
                                            Drag to Create Version
                                          </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                          <a
                                            href={version.r2_url}
                                            download={version.original_filename}
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                          </a>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setDeleteDialog({
                                              open: true,
                                              mediaFile: version,
                                              isDeleting: false,
                                            })
                                          }
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Version
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Review Link Dialog */}
      <Dialog
        open={createLinkDialog.open}
        onOpenChange={(open) =>
          setCreateLinkDialog({
            open,
            isCreating: false,
            showSuccess: false,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createLinkDialog.showSuccess
                ? "Review Link Created!"
                : "Create Review Link"}
            </DialogTitle>
          </DialogHeader>

          {createLinkDialog.showSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Link created successfully!</p>
                    <p className="text-sm text-muted-foreground">
                      The link has been copied to your clipboard
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Review Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createLinkDialog.createdUrl || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <RevButtons
                    variant="outline"
                    onClick={() =>
                      handleCopyReviewLink(
                        createLinkDialog.createdUrl?.split("/").pop() || ""
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </RevButtons>
                  <RevButtons
                    variant="outline"
                    onClick={() =>
                      window.open(createLinkDialog.createdUrl, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </RevButtons>
                </div>
              </div>

              <div className="flex justify-end">
                <RevButtons
                  onClick={() =>
                    setCreateLinkDialog({
                      open: false,
                      isCreating: false,
                      showSuccess: false,
                    })
                  }
                >
                  Done
                </RevButtons>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                if (createLinkDialog.mediaFile) {
                  handleCreateReviewLink(createLinkDialog.mediaFile, title);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Review Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a title for this review"
                  defaultValue={createLinkDialog.mediaFile?.original_filename}
                />
              </div>

              <div className="flex justify-end gap-2">
                <RevButtons
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCreateLinkDialog({
                      open: false,
                      isCreating: false,
                      showSuccess: false,
                    })
                  }
                >
                  Cancel
                </RevButtons>
                <RevButtons
                  type="submit"
                  disabled={createLinkDialog.isCreating}
                >
                  {createLinkDialog.isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Create & Copy Link
                    </>
                  )}
                </RevButtons>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Review Links Dialog */}
      <Dialog
        open={viewLinksDialog.open}
        onOpenChange={(open) =>
          setViewLinksDialog({
            open,
            links: [],
            isLoading: false,
          })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Links</DialogTitle>
            {viewLinksDialog.mediaFile && (
              <p className="text-sm text-muted-foreground">
                Links for: {viewLinksDialog.mediaFile.original_filename}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {viewLinksDialog.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : viewLinksDialog.links.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No review links created yet</p>
                <p className="text-sm">
                  Create your first review link to share this media
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {viewLinksDialog.links.map((link) => (
                  <Card key={link.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">
                            {link.title || "Untitled Review"}
                          </h4>
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Created {formatDate(link.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                            {getReviewUrl(link.link_token)}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyReviewLink(link.link_token)}
                        >
                          <Copy className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(getReviewUrl(link.link_token), "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant={link.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            handleToggleReviewLink(link.id, link.is_active)
                          }
                        >
                          {link.is_active ? "Deactivate" : "Activate"}
                        </RevButtons>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            isDeleting: false,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteDialog.mediaFile?.original_filename}"? This action cannot
              be undone and will also disable all review links for this media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.mediaFile &&
                handleDeleteMedia(deleteDialog.mediaFile)
              }
              disabled={deleteDialog.isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDialog.isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
