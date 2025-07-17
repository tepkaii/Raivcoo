// app/dashboard/projects/[id]/folders/components/FolderCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Calendar, ChevronRight } from "lucide-react";
import { ProjectFolder, MediaFile } from "@/app/dashboard/lib/types";
import { EditFolderDialog } from "./EditFolderDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { Badge } from "@/components/ui/badge";
import {
  FolderIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

interface FolderStats {
  totalFiles: number;
  totalSize: number;
  videoCount: number;
  imageCount: number;
  lastUpload: string | null;
}

interface EnhancedProjectFolder extends ProjectFolder {
  media_files?: MediaFile[];
  stats?: FolderStats;
}

interface FolderCardProps {
  folder: EnhancedProjectFolder;
  projectId: string;
  viewMode: "grid" | "list";
  onFoldersUpdate: (folders: EnhancedProjectFolder[]) => void;
  allFolders: EnhancedProjectFolder[];
}

// Media thumbnail component (similar to MainProjectsList)
function MediaThumbnail({ media }: { media: MediaFile }) {
  const getFileCategory = (fileType: string, mimeType: string) => {
    if (fileType === "video") return "video";
    if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
    if (mimeType === "image/svg+xml") return "svg";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType === "application/pdf" ||
      mimeType.includes("document") ||
      mimeType.includes("presentation") ||
      mimeType === "text/plain"
    )
      return "document";
    return "unknown";
  };

  const fileCategory = getFileCategory(media.file_type, media.mime_type);

  const getThumbnailUrl = () => {
    if (media.thumbnail_r2_url && media.thumbnail_r2_url.trim() !== "") {
      return media.thumbnail_r2_url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  const renderContent = () => {
    switch (fileCategory) {
      case "image":
        const imageUrl = thumbnailUrl || media.r2_url;
        return (
          <img
            src={imageUrl}
            alt={media.original_filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        );

      case "video":
        if (thumbnailUrl) {
          return (
            <img
              src={thumbnailUrl}
              alt={`${media.original_filename} thumbnail`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
        } else {
          return (
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <VideoCameraIcon className="h-6 w-6 text-white/80" />
            </div>
          );
        }

      case "audio":
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-800 flex items-center justify-center">
            <MusicalNoteIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      case "svg":
        return (
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-teal-800 flex items-center justify-center">
            <CodeBracketIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      case "document":
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <DocumentIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <DocumentIcon className="h-6 w-6 text-white/80" />
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
      {renderContent()}
    </div>
  );
}

// Media gallery component (similar to MainProjectsList)
function FolderMediaGallery({ folder }: { folder: EnhancedProjectFolder }) {
  const displayMedia = folder.media_files || [];
  const hasMedia = displayMedia.length > 0;

  if (!hasMedia) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <FolderIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">Empty folder</p>
        </div>
      </div>
    );
  }

  const mediaCount = displayMedia.length;

  const renderGallery = () => {
    switch (mediaCount) {
      case 1:
        return (
          <div className="w-full h-full">
            <MediaThumbnail media={displayMedia[0]} />
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            {displayMedia.map((media) => (
              <div key={media.id} className="w-full h-full">
                <MediaThumbnail media={media} />
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            <div className="w-full h-full">
              <MediaThumbnail media={displayMedia[0]} />
            </div>
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="w-full h-full">
                <MediaThumbnail media={displayMedia[1]} />
              </div>
              <div className="w-full h-full">
                <MediaThumbnail media={displayMedia[2]} />
              </div>
            </div>
          </div>
        );

      case 4:
      default:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
            {displayMedia.slice(0, 4).map((media) => (
              <div key={media.id} className="w-full h-full">
                <MediaThumbnail media={media} />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="px-2 py-3 relative" style={{ aspectRatio: "16/9" }}>
      <div className="w-full h-full">{renderGallery()}</div>

      {/* Show remaining count if more than 4 items */}
      {(folder.stats?.totalFiles || 0) > 4 && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          +{(folder.stats?.totalFiles || 0) - 4} more
        </div>
      )}
    </div>
  );
}

export function FolderCard({
  folder,
  projectId,
  viewMode,
  onFoldersUpdate,
  allFolders,
}: FolderCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFolderUpdated = (updatedFolder: EnhancedProjectFolder) => {
    const updatedFolders = allFolders.map((f) =>
      f.id === updatedFolder.id ? updatedFolder : f
    );
    onFoldersUpdate(updatedFolders);
    setEditDialogOpen(false);
  };

  const handleFolderDeleted = () => {
    const updatedFolders = allFolders.filter((f) => f.id !== folder.id);
    onFoldersUpdate(updatedFolders);
    setDeleteDialogOpen(false);
  };

  if (viewMode === "list") {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <Link href={`/dashboard/projects/${projectId}/folders/${folder.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${folder.color}20` }}
                  >
                    <FolderIcon
                      className="h-5 w-5"
                      style={{ color: folder.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {folder.name}
                    </h3>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {folder.stats?.videoCount &&
                      folder.stats.videoCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <VideoCameraIcon className="h-3 w-3" />
                          {folder.stats.videoCount}
                        </Badge>
                      )}
                    {folder.stats?.imageCount &&
                      folder.stats.imageCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <DocumentIcon className="h-3 w-3" />
                          {folder.stats.imageCount}
                        </Badge>
                      )}
                    {(folder.stats?.totalFiles || 0) === 0 && (
                      <Badge variant="secondary">Empty</Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {folder.stats?.totalFiles || 0} files
                  </div>

                  {folder.stats?.totalSize && folder.stats.totalSize > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(folder.stats.totalSize)}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {formatDate(folder.created_at)}
                  </div>

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <PencilSquareIcon className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <EditFolderDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          folder={folder}
          projectId={projectId}
          onFolderUpdated={handleFolderUpdated}
        />

        <DeleteFolderDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          folder={folder}
          projectId={projectId}
          onFolderDeleted={handleFolderDeleted}
        />
      </>
    );
  }
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  return (
    <>
      <Card
        className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden relative"
        style={{ borderColor: hexToRgba(folder.color, 0.3) }} // 60% opacity
      >
        <Link href={`/dashboard/projects/${projectId}/folders/${folder.id}`}>
          {/* Media Thumbnail Gallery */}
          <div className="relative bg-gradient-to-br from-blue-300 to-blue-800">
            <FolderMediaGallery folder={folder} />
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {folder.name}
                  </h3>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {folder.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
              </div>

              {/* Media Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {folder.stats?.totalFiles && folder.stats.totalFiles > 0 ? (
                    <span className="text-muted-foreground">
                      {folder.stats.totalFiles}{" "}
                      {folder.stats.totalFiles === 1 ? "file" : "files"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Empty folder
                    </span>
                  )}
                </div>

                {folder.stats?.totalSize && folder.stats.totalSize > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>{formatFileSize(folder.stats.totalSize)}</span>
                  </div>
                )}
              </div>

              {/* Media Type Indicators */}
              {folder.stats &&
                (folder.stats.videoCount > 0 ||
                  folder.stats.imageCount > 0) && (
                  <div className="flex items-center gap-2 text-xs"></div>
                )}

              {/* Date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(folder.created_at)}</span>
                </div>
                {folder.stats?.lastUpload && (
                  <span>Updated {formatDate(folder.stats.lastUpload)}</span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Folder Actions */}
        <div className="absolute top-2 right-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <EditFolderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        folder={folder}
        projectId={projectId}
        onFolderUpdated={handleFolderUpdated}
      />

      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folder={folder}
        projectId={projectId}
        onFolderDeleted={handleFolderDeleted}
      />
    </>
  );
}
