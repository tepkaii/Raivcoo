"use client";

import React, { useState } from "react";
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
  Settings,
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
  version_name?: string;
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
  version_name?: string;
  versions: MediaFile[];
  currentVersion: MediaFile;
  hasReviewLinks: boolean;
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
  onVersionReorder: (parentId: string, reorderedVersions: MediaFile[]) => void;
  onCreateReviewLink: (mediaFile: MediaFile) => void;
  onViewReviewLinks: (mediaFile: MediaFile) => void;
  onManageReviewLinks: (mediaFile: MediaFile) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
  onOpenVersionManager: (media: OrganizedMedia) => void;
}
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
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
  onVersionReorder,
  onCreateReviewLink,
  onViewReviewLinks,
  onManageReviewLinks,
  onDeleteMedia,
  onOpenVersionManager,
}: MediaCardProps) {
  const hasVersions = media.versions.length > 0;
  const isDropTarget = draggedOver === media.id;
  const isSelected = selectedMedia?.id === media.currentVersion.id;

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
         
        `}
        onClick={() => onMediaSelect(media.currentVersion)}
        onDragStart={(e) => {
          // Make the entire card draggable
          e.dataTransfer.effectAllowed = "copy";
          onDragStart({
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
          });
        }}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggable
      >
        {/* Thumbnail */}
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

          {/* Rest of your overlay content remains the same */}
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
          {/* Drop overlay */}
          {isDropTarget && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                <span>Add Version</span>
              </div>
            </div>
          )}

          {/* Actions overlay - REMOVED DROPDOWN ARROW */}
          <div className="absolute bottom-2 right-2">
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

                {/* Review Link Actions - Only for parent media */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateReviewLink({
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
                    });
                  }}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Create Review Link
                </DropdownMenuItem>

                {media.hasReviewLinks && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReviewLinks({
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
                        });
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      View Review Links
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageReviewLinks({
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
                        });
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Links
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Version Management */}
                {hasVersions && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVersionManager(media);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Versions
                  </DropdownMenuItem>
                )}

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
                    onDeleteMedia({
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
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entire Media
                </DropdownMenuItem>
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
                <span>{formatDate(media.currentVersion.uploaded_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}