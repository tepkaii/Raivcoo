// app/dashboard/projects/[id]/components/media/MediaCard.tsx
"use client";

import React, { useState } from "react";
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
import {
  MediaFile,
  OrganizedMedia,
  ProjectFolder,
  ReviewLink,
} from "@/app/dashboard/types";
import { Button } from "@/components/ui/button";

import { toast } from "@/hooks/use-toast";
import {
  ArrowsUpDownIcon,
  ArrowUpOnSquareStackIcon,
  BoltIcon,
  ClipboardIcon,
  CodeBracketIcon,
  DocumentIcon,
  EyeIcon,
  LinkIcon,
  MusicalNoteIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { changeMediaStatusAction } from "../../lib/StatusChangeActions";
import { createClient } from "@/utils/supabase/client";
import {
  formatFileSize,
  getFileCategory,
  getStatusConfig,
  MEDIA_STATUS_OPTIONS,
} from "@/app/dashboard/utilities";
import { MoveMediaDialog } from "../Dialogs/MoveMediaDialog";

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
  onRenameMedia: (mediaFile: MediaFile) => void;
  userPermissions: {
    canUpload: boolean;
    canDelete: boolean;
    canEditStatus: boolean;
    canCreateReviewLinks: boolean;
  };
  projectId: string;
  reviewLinks: ReviewLink[];
  onReviewLinksUpdated: (newLinks: ReviewLink[]) => void;
  // Add these missing props:
  allFolders: ProjectFolder[];
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
}

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
    onRenameMedia,
    reviewLinks,
    onReviewLinksUpdated,
    allFolders, // ✅ Now available
    onMediaUpdated, // ✅ Now available
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

    const [moveDialogOpen, setMoveDialogOpen] = useState(false);

    const handleMoveMedia = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setMoveDialogOpen(true);
    }, []);
    const handleMoveComplete = React.useCallback(
      (updatedMedia: MediaFile) => {
        // Update your media state here
        // This will depend on how you manage state in your parent component
        onMediaUpdated([updatedMedia]);
      },
      [onMediaUpdated]
    );
    const [latestLink, setLatestLink] = React.useState<{
      link_token: string;
      title?: string;
    } | null>(null);
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

    React.useEffect(() => {
      const fetchLatestLink = async () => {
        try {
          const supabase = createClient();
          const { data: link, error } = await supabase
            .from("review_links")
            .select("link_token, title")
            .eq("media_id", media.currentVersion.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && link) {
            setLatestLink(link);
          } else {
            setLatestLink(null);
          }
        } catch (error) {
          console.error("Error fetching latest link:", error);
          setLatestLink(null);
        }
      };

      fetchLatestLink();
    }, [media.currentVersion.id, media.hasReviewLinks]);

    // ✅ Create quick link directly without opening dialog
    const createQuickLink = React.useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
          // Show creating toast
          toast({
            title: "Creating Quick Link",
            description: "Creating review link with default settings...",
            variant: "default",
          });

          const supabase = createClient();

          // Generate unique link token
          const linkToken = crypto.randomUUID().replace(/-/g, "");

          // Create the review link directly in database
          const { data: newLink, error } = await supabase
            .from("review_links")
            .insert({
              project_id: projectId,
              media_id: media.currentVersion.id,
              link_token: linkToken,
              title: `Quick link for ${media.currentVersion.original_filename}`,
              is_active: true,
              expires_at: null, // No expiration
              requires_password: false,
              password_hash: null,
              allow_download: true, // Allow download
            })
            .select()
            .single();

          if (error) {
            throw error;
          }

          // Create the full URL
          const linkUrl = `${window.location.origin}/review/${linkToken}`;

          // Copy to clipboard
          await navigator.clipboard.writeText(linkUrl);

          // Update latest link state
          setLatestLink({
            link_token: linkToken,
            title: newLink.title,
          });

          // Show success toast
          toast({
            title: "Quick Link Created!",
            description: "Review link created and copied to clipboard",
            variant: "green",
          });

          // ✅ Update review links state to reflect new link - ADD THIS
          const updatedReviewLinks = [...reviewLinks, newLink];
          onReviewLinksUpdated(updatedReviewLinks);
        } catch (error) {
          console.error("Failed to create quick link:", error);
          toast({
            title: "Failed to Create Quick Link",
            description: "Could not create review link. Please try again.",
            variant: "destructive",
          });
        }
      },
      [media.currentVersion, projectId, reviewLinks, onReviewLinksUpdated]
    );

    // ✅ Copy latest link handler
    const copyLatestLink = React.useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!latestLink) {
          toast({
            title: "No Links Found",
            description: "No active review links found for this media",
            variant: "destructive",
          });
          return;
        }

        try {
          const linkUrl = `${window.location.origin}/review/${latestLink.link_token}`;
          await navigator.clipboard.writeText(linkUrl);

          toast({
            title: "Link Copied",
            description: `"${latestLink.title || "Latest link"}" copied to clipboard`,
            variant: "green",
          });
        } catch (error) {
          toast({
            title: "Failed to Copy Link",
            description: "Could not copy link to clipboard",
            variant: "destructive",
          });
        }
      },
      [latestLink]
    );
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
            // Video types
            "video/mp4",
            "video/mov",
            "video/avi",
            "video/mkv",
            "video/webm",
            // Image types
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            // Audio types
            "audio/mpeg", // MP3
            "audio/wav",
            "audio/ogg",
            "audio/flac",
            "audio/aac",
            "audio/mp4", // M4A
            "audio/x-wav", // Alternative WAV
            "audio/vorbis", // OGG Vorbis
            // Document types
            "application/pdf",
            "application/msword", // DOC
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
            "application/vnd.ms-powerpoint", // PPT
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
            "text/plain", // TXT
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
        // Pass the current version, not the parent media
        onDeleteMedia(media.currentVersion); // Changed from stableMediaObject
      },
      [onDeleteMedia, media.currentVersion]
    );
    const handleRenameMedia = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRenameMedia(media.currentVersion);
      },
      [onRenameMedia, media.currentVersion]
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
            {(() => {
              const category = getFileCategory(
                media.currentVersion.file_type,
                media.currentVersion.mime_type
              );

              switch (category) {
                case "image":
                  return (
                    <img
                      src={media.currentVersion.r2_url}
                      alt={media.currentVersion.original_filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  );

                case "video":
                  return media.currentVersion.thumbnail_r2_url ? (
                    <img
                      src={media.currentVersion.thumbnail_r2_url}
                      alt={`${media.currentVersion.original_filename} thumbnail`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    // ✅ Video fallback with gradient and icon (NO actual video)
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                      <VideoCameraIcon className="h-16 w-16 text-white/80 mb-2" />
                      <span className="text-white/60 text-sm text-center px-4">
                        {media.currentVersion.original_filename}
                      </span>
                    </div>
                  );

                case "audio":
                  return (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-purple-500 to-blue-800">
                      <MusicalNoteIcon className="h-16 w-16 text-white/80 mb-2" />
                      <span className="text-white/60 text-sm text-center px-4">
                        {media.currentVersion.original_filename}
                      </span>
                    </div>
                  );

                case "svg": // ✅ New SVG category with special styling
                  return (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-green-600 to-teal-800">
                      <CodeBracketIcon className="h-16 w-16 text-white/80 mb-2" />
                      <span className="text-white/60 text-sm text-center px-4">
                        {media.currentVersion.original_filename}
                      </span>
                    </div>
                  );

                case "document":
                  return (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                      <DocumentIcon className="h-16 w-16 text-white/80 mb-2" />
                      <span className="text-white/60 text-sm text-center px-4">
                        {media.currentVersion.original_filename}
                      </span>
                    </div>
                  );

                default:
                  return (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                      <DocumentIcon className="h-16 w-16 text-white/80 mb-2" />
                      <span className="text-white/60 text-sm text-center px-4">
                        {media.currentVersion.original_filename}
                      </span>
                    </div>
                  );
              }
            })()}

            {/* Type badge - Update to show SVG category */}
            <div className="absolute top-2 left-2">
              <Badge variant="outline">
                {(() => {
                  const category = getFileCategory(
                    media.currentVersion.file_type,
                    media.currentVersion.mime_type
                  );
                  switch (category) {
                    case "video":
                      return (
                        <>
                          <VideoCameraIcon className="h-3 w-3 mr-1" />
                          Video
                        </>
                      );
                    case "image":
                      return (
                        <>
                          <PhotoIcon className="h-3 w-3 mr-1" />
                          Image
                        </>
                      );
                    case "svg": // ✅ New SVG badge
                      return (
                        <>
                          <CodeBracketIcon className="h-3 w-3 mr-1" />
                          SVG
                        </>
                      );
                    case "audio":
                      return (
                        <>
                          <MusicalNoteIcon className="h-3 w-3 mr-1" />
                          Audio
                        </>
                      );
                    case "document":
                      return (
                        <>
                          <DocumentIcon className="h-3 w-3 mr-1" />
                          Document
                        </>
                      );
                    default:
                      return (
                        <>
                          <DocumentIcon className="h-3 w-3 mr-1" />
                          File
                        </>
                      );
                  }
                })()}
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
                  {userPermissions.canCreateReviewLinks && (
                    <DropdownMenuItem onClick={createQuickLink}>
                      <BoltIcon className="h-4 w-4 mr-2" />
                      Quick Link
                    </DropdownMenuItem>
                  )}
                  {latestLink && userPermissions.canCreateReviewLinks && (
                    <DropdownMenuItem onClick={copyLatestLink}>
                      <ClipboardIcon className="h-4 w-4 mr-2" />
                      Copy: "{latestLink.title || "Latest Link"}"
                    </DropdownMenuItem>
                  )}
                  {/* Review Link Actions - Only collaborators */}
                  {userPermissions.canCreateReviewLinks && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCreateReviewLink}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Create Link with Options
                      </DropdownMenuItem>

                      {media.hasReviewLinks && (
                        <DropdownMenuItem onClick={handleViewReviewLinks}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Manage All Links
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {/* Version Management - Only collaborators */}
                  {hasVersions && userPermissions.canUpload && (
                    <>
                      <DropdownMenuItem onClick={handleOpenVersionManager}>
                        <ArrowUpOnSquareStackIcon className="h-4 w-4 mr-2" />
                        Manage Versions
                      </DropdownMenuItem>
                    </>
                  )}{" "}
                  <DropdownMenuItem onClick={handleMoveMedia}>
                    <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
                    Move Media
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Download - Everyone can download */}
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  {/* View Media - Everyone can view */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/media/${media.currentVersion.id}`,
                        "_blank"
                      );
                    }}
                  >
                    <VideoCameraIcon className="h-4 w-4 mr-2" />
                    View Media
                  </DropdownMenuItem>{" "}
                  <DropdownMenuSeparator />
                  {userPermissions.canUpload && (
                    <DropdownMenuItem onClick={handleRenameMedia}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  {/* Delete - Only collaborators */}
                  {userPermissions.canDelete && (
                    <>
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
                  title={media.currentVersion.original_filename} // ✅ Use currentVersion filename
                >
                  {media.currentVersion.original_filename}{" "}
                  {/* ✅ Use currentVersion filename */}
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
                      className="w-full text-xs bg-transparent rounded-full"
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
        <MoveMediaDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          mediaFile={media.currentVersion}
          allFolders={allFolders} // Pass this from parent
          projectId={projectId}
          onMoveComplete={handleMoveComplete}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.media.id === nextProps.media.id &&
      prevProps.media.currentVersion.id === nextProps.media.currentVersion.id &&
      prevProps.media.currentVersion.original_filename ===
        nextProps.media.currentVersion.original_filename && // ✅ Add filename comparison
      prevProps.media.currentVersion.status ===
        nextProps.media.currentVersion.status &&
      prevProps.selectedMedia?.id === nextProps.selectedMedia?.id &&
      prevProps.draggedOver === nextProps.draggedOver &&
      prevProps.draggedMedia?.id === nextProps.draggedMedia?.id &&
      prevProps.expandedMedia.has(prevProps.media.id) ===
        nextProps.expandedMedia.has(nextProps.media.id) &&
      prevProps.media.hasReviewLinks === nextProps.media.hasReviewLinks &&
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