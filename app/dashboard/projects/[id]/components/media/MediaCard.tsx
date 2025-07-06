// app/dashboard/projects/[id]/components/media/MediaCard.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MediaFile, OrganizedMedia } from "@/app/dashboard/lib/types";
import { Button } from "@/components/ui/button";

import { toast } from "@/hooks/use-toast";
import {
  ArrowUpOnSquareStackIcon,
  EyeIcon,
  LinkIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { changeMediaStatusAction } from "../../lib/StatusChangeActions";

// Status configuration - can be easily modified
export const MEDIA_STATUS_OPTIONS = [
  { value: "on_hold", label: "On Hold", color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "needs_review", label: "Needs Review", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
] as const;

export const getStatusConfig = (status: string) => {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status) || {
      value: status,
      label: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "bg-gray-500",
    }
  );
};

interface MediaCardProps {
  media: OrganizedMedia;
  selectedMedia: MediaFile | null;
  expandedMedia: Set<string>;
  draggedOver: string | null;
  draggedMedia: MediaFile | null;
  onMediaSelect: (media: MediaFile | null) => void;
  onExpandToggle: (mediaId: string) => void;
  onDragStart: (media: MediaFile) => void;
  onDragEnd: () => void;
  onDragOver: (mediaId: string) => void;
  onDragLeave: () => void;
  onDrop: (targetId: string, files: File[]) => void;
  onVersionReorder: (parentId: string, reorderedVersions: MediaFile[]) => void;
  onCreateReviewLink: (mediaFile: MediaFile) => void;
  onViewReviewLinks: (mediaFile: MediaFile) => void;
  onManageReviewLinks: (mediaFile: MediaFile) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
  onOpenVersionManager: (media: OrganizedMedia) => void;
  onStatusChange: (mediaFile: MediaFile, newStatus: string) => void;
  userPermissions: {
    canUpload: boolean;
    canDelete: boolean;
    canEditStatus: boolean;
    canCreateReviewLinks: boolean;
  };
  projectId: string;
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ✅ MEMOIZED MediaCard component with proper download functionality
export const MediaCard = React.memo(
  function MediaCard({
    media,
    selectedMedia,
    expandedMedia,
    draggedOver,
    draggedMedia,
    onMediaSelect,
    onExpandToggle,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onVersionReorder,
    onCreateReviewLink,
    onViewReviewLinks,
    onManageReviewLinks,
    onDeleteMedia,
    onOpenVersionManager,
    onStatusChange,
    userPermissions,
    projectId,
  }: MediaCardProps) {
    // ✅ Stable media object creation (performance optimization)
    const stableMediaObject = React.useMemo(
      () => ({
        id: media.id,
        filename: media.filename,
        original_filename: media.original_filename,
        file_type: media.file_type,
        mime_type: media.mime_type,
        file_size: media.file_size,
        r2_url: media.r2_url,
        uploaded_at: media.uploaded_at,
        version_number: media.version_number,
        is_current_version: media.is_current_version,
        version_name: media.version_name,
        status: media.currentVersion.status || "in_progress",
        parent_media_id: media.parent_media_id,
      }),
      [media]
    );

    // ✅ Memoized computed values
    const hasVersions = media.versions.length > 0;
    const isDropTarget = draggedOver === media.id;
    const isSelected = selectedMedia?.id === media.currentVersion.id;
    const [localStatus, setLocalStatus] = React.useState(
      media.currentVersion.status || "in_progress"
    );

    // ✅ Memoized date formatting
    const formattedDate = React.useMemo(() => {
      return new Date(media.currentVersion.uploaded_at).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
    }, [media.currentVersion.uploaded_at]);

    React.useEffect(() => {
      setLocalStatus(media.currentVersion.status || "in_progress");
    }, [media.currentVersion.status]);

    // ✅ Download handler - Forces direct download
    const handleDownload = React.useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
          // Show loading toast
          toast({
            title: "Starting Download",
            description: `Downloading ${media.currentVersion.original_filename}...`,
            variant: "default",
          });

          // Fetch the file as blob
          const response = await fetch(media.currentVersion.r2_url);

          if (!response.ok) {
            throw new Error("Download failed");
          }

          const blob = await response.blob();

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = media.currentVersion.original_filename;

          // Trigger download
          document.body.appendChild(link);
          link.click();

          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast({
            title: "Download Complete",
            description: `${media.currentVersion.original_filename} has been downloaded`,
            variant: "green",
          });
        } catch (error) {
          console.error("Download failed:", error);
          toast({
            title: "Download Failed",
            description: "Could not download the file. Please try again.",
            variant: "destructive",
          });
        }
      },
      [media.currentVersion.r2_url, media.currentVersion.original_filename]
    );

    // ✅ Stable event handlers (performance optimization)
    const handleClick = React.useCallback(() => {
      onMediaSelect(media.currentVersion);
    }, [onMediaSelect, media.currentVersion]);

    const handleDragStart = React.useCallback(
      (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(stableMediaObject);
      },
      [onDragStart, stableMediaObject]
    );

    const handleDragEnd = React.useCallback(
      (e: React.DragEvent) => {
        onDragEnd();
      },
      [onDragEnd]
    );

    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";

        if (e.dataTransfer.types.includes("Files") || draggedMedia) {
          onDragOver(media.id);
        }
      },
      [onDragOver, media.id, draggedMedia]
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (
          x < rect.left ||
          x > rect.right ||
          y < rect.top ||
          y > rect.bottom
        ) {
          onDragLeave();
        }
      },
      [onDragLeave]
    );

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();

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
            onDrop(media.id, validFiles);
          }
          return;
        }

        if (draggedMedia) {
          if (
            draggedMedia.id === media.id ||
            draggedMedia.parent_media_id === media.id
          ) {
            return; // Invalid drop
          }
          onDrop(media.id, []);
        }
      },
      [onDrop, media.id, draggedMedia]
    );
    const handleStatusChange = React.useCallback(
      async (newStatus: string) => {
        const originalStatus = localStatus;
        setLocalStatus(newStatus);

        try {
          const result = await changeMediaStatusAction(
            // You'll need to pass projectId from props
            projectId,
            media.currentVersion.id,
            newStatus
          );

          if (!result.success) {
            setLocalStatus(originalStatus);
            toast({
              title: "Failed to Update Status",
              description:
                result.error ||
                "Could not update media status. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Status Updated",
              description: result.message,
              variant: "default",
            });
            // Call the parent's onStatusChange to update the state
            onStatusChange(media.currentVersion, newStatus);
          }
        } catch (error) {
          setLocalStatus(originalStatus);
          toast({
            title: "Failed to Update Status",
            description: "Could not update media status. Please try again.",
            variant: "destructive",
          });
        }
      },
      [media.currentVersion.id, localStatus, projectId, onStatusChange]
    );

    // ✅ Stable dropdown handlers (performance optimization)
    const handleCreateReviewLink = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCreateReviewLink(stableMediaObject);
      },
      [onCreateReviewLink, stableMediaObject]
    );

    const handleViewReviewLinks = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onManageReviewLinks(stableMediaObject);
      },
      [onManageReviewLinks, stableMediaObject]
    );

    const handleOpenVersionManager = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenVersionManager(media);
      },
      [onOpenVersionManager, media]
    );

    const handleDeleteMedia = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteMedia(stableMediaObject);
      },
      [onDeleteMedia, stableMediaObject]
    );

    return (
      <div className="space-y-2">
        {/* Main Media Card */}
        <Card
          className={`
            bg-primary-foreground overflow-hidden transition-all cursor-pointer group
            ${isDropTarget ? "ring-2 ring-primary bg-primary/10 scale-105" : ""}
            ${isSelected ? "ring-ring/50 border-ring ring-[3px] border" : "hover:bg-muted/50"}
          `}
          onClick={handleClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          draggable
        >
          <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
            {media.currentVersion.file_type === "image" ? (
              <img
                src={media.currentVersion.r2_url}
                alt={media.currentVersion.original_filename}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={media.currentVersion.r2_url}
                className="max-w-full max-h-full object-contain"
                muted
                preload="metadata"
              />
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="outline">
                {media.currentVersion.file_type === "video" ? (
                  <>
                    <VideoCameraIcon className="h-3 w-3 mr-1" />
                    Video
                  </>
                ) : (
                  <>
                    <PhotoIcon className="h-3 w-3 mr-1" />
                    Image
                  </>
                )}
              </Badge>
            </div>

            {/* Version badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs">
                v{media.currentVersion.version_number}
              </Badge>
            </div>

            {/* Drop overlay */}
            {isDropTarget && (
              <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                <div className="bg-primary border-2 border-black/20 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                  <span>Drop To Another Media</span>
                </div>
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute bottom-2 right-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* View Media - Everyone can view */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/media/full-size/${media.currentVersion.id}`,
                        "_blank"
                      );
                    }}
                  >
                    <VideoCameraIcon className="h-4 w-4 mr-2" />
                    View Media
                  </DropdownMenuItem>

                  {/* Download - Everyone can download */}
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  {/* Review Link Actions - Only collaborators */}
                  {userPermissions.canCreateReviewLinks && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCreateReviewLink}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Create Review Link
                      </DropdownMenuItem>

                      {media.hasReviewLinks && (
                        <DropdownMenuItem onClick={handleViewReviewLinks}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Manage Review Links
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Version Management - Only collaborators */}
                  {hasVersions && userPermissions.canUpload && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleOpenVersionManager}>
                        <ArrowUpOnSquareStackIcon className="h-4 w-4 mr-2" />
                        Manage Versions
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Delete - Only collaborators */}
                  {userPermissions.canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:bg-red-600 focus:text-white"
                        onClick={handleDeleteMedia}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Media
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 border-t-2">
            <div className="space-y-2">
              <div>
                <h3
                  className="font-medium text-white text-sm truncate"
                  title={media.original_filename}
                >
                  {media.original_filename}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>{formatFileSize(media.currentVersion.file_size)}</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Status Selector - Only show for reviewers and collaborators */}
              {userPermissions.canEditStatus && (
                <div className="mt-2">
                  <Select
                    value={localStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger
                      className="w-full text-xs bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${option.color}`}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status Display - For viewers (read-only) */}
              {!userPermissions.canEditStatus && (
                <div className="mt-2">
                  <div className="w-full text-xs bg-muted rounded px-2 py-1.5 flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStatusConfig(localStatus).color
                      }`}
                    />
                    {getStatusConfig(localStatus).label}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // ✅ Optimized comparison function (performance optimization only)
    return (
      prevProps.media.id === nextProps.media.id &&
      prevProps.media.currentVersion.id === nextProps.media.currentVersion.id &&
      prevProps.media.currentVersion.status ===
        nextProps.media.currentVersion.status &&
      prevProps.selectedMedia?.id === nextProps.selectedMedia?.id &&
      prevProps.draggedOver === nextProps.draggedOver &&
      prevProps.draggedMedia?.id === nextProps.draggedMedia?.id &&
      prevProps.expandedMedia.has(prevProps.media.id) ===
        nextProps.expandedMedia.has(nextProps.media.id) &&
      prevProps.media.hasReviewLinks === nextProps.media.hasReviewLinks &&
      // Add userPermissions to comparison
      prevProps.userPermissions.canUpload ===
        nextProps.userPermissions.canUpload &&
      prevProps.userPermissions.canDelete ===
        nextProps.userPermissions.canDelete &&
      prevProps.userPermissions.canEditStatus ===
        nextProps.userPermissions.canEditStatus &&
      prevProps.userPermissions.canCreateReviewLinks ===
        nextProps.userPermissions.canCreateReviewLinks
    );
  }
);

MediaCard.displayName = "MediaCard";