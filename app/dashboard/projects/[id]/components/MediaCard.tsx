"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Badge } from "@/components/ui/badge";
import {
  FileVideo,
  Image as ImageIcon,
  MoreVertical,
  Link,
  Eye,
  Trash2,
  Download,
  Share,
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

interface MediaCardProps {
  media: OrganizedMedia;
  selectedMedia: MediaFile | null;
  expandedMedia: Set<string>;
  draggedOver: string | null;
  draggedMedia: MediaFile | null;
  onMediaSelect: (media: MediaFile) => void;
  onExpandToggle: (mediaId: string) => void;
  onDragStart: (media: MediaFile) => void;
  onDragEnd: () => void;
  onDragOver: (mediaId: string) => void;
  onDragLeave: () => void;
  onDrop: (targetId: string, files: File[]) => void;
  onSetCurrentVersion: (parentId: string, versionId: string) => void;
  onCreateReviewLink: (mediaFile: MediaFile) => void;
  onViewReviewLinks: (mediaFile: MediaFile) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
}

export function MediaCard({
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
  onSetCurrentVersion,
  onCreateReviewLink,
  onViewReviewLinks,
  onDeleteMedia,
}: MediaCardProps) {
  const hasVersions = media.versions.length > 0;
  const isExpanded = expandedMedia.has(media.id);
  const isDropTarget = draggedOver === media.id;
  const isSelected = selectedMedia?.id === media.currentVersion.id;
  const totalVersions = hasVersions ? media.versions.length + 1 : 1;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    if (e.dataTransfer.types.includes("Files") || draggedMedia) {
      onDragOver(media.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
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
  };

  return (
    <div className="space-y-2">
      {/* Main Media Card */}
      <Card
        className={`
          bg-primary-foreground overflow-hidden transition-all cursor-pointer group
          ${isDropTarget ? "ring-2 ring-primary bg-primary/10 scale-105" : ""}
          ${isSelected ? "ring-2 ring-blue-500" : "hover:bg-gray-750"}
          ${hasVersions ? "border-b-4 border-b-blue-500/30" : ""}
        `}
        onClick={() => onMediaSelect(media.currentVersion)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-700 overflow-hidden">
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
              muted
              preload="metadata"
            />
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="outline">
              {media.currentVersion.file_type === "video" ? (
                <>
                  <FileVideo className="h-3 w-3 mr-1" />
                  Video
                </>
              ) : (
                <>
                  <ImageIcon className="h-3 w-3 mr-1" />
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

          {/* Version count */}
          {hasVersions && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline">{totalVersions} versions</Badge>
            </div>
          )}

          {/* Drop overlay */}
          {isDropTarget && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Version
              </div>
            </div>
          )}

          {/* Actions overlay */}
          <div className="absolute bottom-2 right-2 ">
            <div className="flex items-center gap-1">
              {/* Expand/Collapse */}
              {hasVersions && (
                <RevButtons
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandToggle(media.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </RevButtons>
              )}

              {/* Actions dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <RevButtons
                    variant="outline"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </RevButtons>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div
                      className="flex items-center w-full cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStart(media.currentVersion);
                      }}
                      onDragEnd={onDragEnd}
                    >
                      <GripVertical className="h-4 w-4 mr-2" />
                      Drag to Create Version
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(media.currentVersion.r2_url, "_blank");
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateReviewLink(media.currentVersion);
                    }}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Create Review Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReviewLinks(media.currentVersion);
                    }}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    View Review Links
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href={media.currentVersion.r2_url}
                      download={media.currentVersion.original_filename}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400 focus:bg-red-600 focus:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMedia(media.currentVersion);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                <span>{formatDate(media.currentVersion.uploaded_at)}</span>
              </div>
            </div>

            {/* Current version indicator */}
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Current: v{media.currentVersion.version_number}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Versions Grid (Collapsible) */}
      {hasVersions && isExpanded && (
        <div className="grid grid-cols-1 gap-2 ml-1 border-l-2 border-gray-700 pl-2">
          {/* Parent version first */}
          <Card
            className={`
              border bg-primary-foreground cursor-pointer transition-all group
             ${draggedOver === media.id ? "ring-1 ring-primary bg-primary/5" : "hover:bg-gray-750/60"}
             ${selectedMedia?.id === media.id ? "ring-1 ring-blue-500" : ""}
           `}
            onClick={() =>
              onMediaSelect({
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
              })
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex gap-3 p-3">
              {/* Thumbnail */}
              <div className="relative w-16 h-12 bg-muted-foreground border rounded overflow-hidden flex-shrink-0">
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
                    muted
                    preload="metadata"
                  />
                )}

                <div className="absolute top-1 left-1">
                  <Badge
                    variant={media.is_current_version ? "default" : "outline"}
                    className="text-xs"
                  >
                    v1
                  </Badge>
                </div>

                {draggedOver === media.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-sm font-medium text-white truncate"
                        title={media.original_filename}
                      >
                        {media.original_filename}
                      </h4>
                      {media.is_current_version && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      <p>
                        {formatFileSize(media.file_size)} •{" "}
                        {formatDate(media.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!media.is_current_version && (
                      <RevButtons
                        variant="outline"
                        size="sm"
                        onClick={() => onSetCurrentVersion(media.id, media.id)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Set Current
                      </RevButtons>
                    )}
                    <RevButtons
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(media.r2_url, "_blank")}
                      className="text-gray-400 hover:text-white"
                    >
                      <Eye className="h-3 w-3" />
                    </RevButtons>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Show versions (newest first) */}
          {media.versions.map((version) => (
            <Card
              key={version.id}
              className={`
               bg-primary-foreground border cursor-pointer transition-all group
               ${draggedOver === version.id ? "ring-1 ring-primary bg-primary/5" : "hover:bg-gray-750/60"}
               ${selectedMedia?.id === version.id ? "ring-1 ring-blue-500" : ""}
             `}
              onClick={() => onMediaSelect(version)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <div className="relative w-16 h-12 bg-muted-foreground border rounded overflow-hidden flex-shrink-0">
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
                      muted
                      preload="metadata"
                    />
                  )}

                  <div className="absolute top-1 left-1">
                    <Badge
                      variant={
                        version.is_current_version ? "default" : "outline"
                      }
                      className="text-xs"
                    >
                      v{version.version_number}
                    </Badge>
                  </div>

                  {draggedOver === version.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className="text-sm font-medium text-white truncate"
                          title={version.original_filename}
                        >
                          {version.original_filename}
                        </h4>
                        {version.is_current_version && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        <p>
                          {formatFileSize(version.file_size)} •{" "}
                          {formatDate(version.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!version.is_current_version && (
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onSetCurrentVersion(media.id, version.id)
                          }
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set Current
                        </RevButtons>
                      )}
                      <RevButtons
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(version.r2_url, "_blank")}
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="h-3 w-3" />
                      </RevButtons>
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
}
