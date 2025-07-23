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
import { MoreVertical, ChevronRight } from "lucide-react";
import { ProjectFolder, MediaFile } from "@/app/dashboard/types";
import { EditFolderDialog } from "./EditFolderDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { MoveFolderDialog } from "./MoveFolderDialog";
import { Badge } from "@/components/ui/badge";
import {
  FolderIcon,
  VideoCameraIcon,
  DocumentIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsUpDownIcon, // ✅ Better icon for moving folders
} from "@heroicons/react/24/solid";
import { MacOSFolderIcon } from "./AnimatedFolderIcon";
import { formatDate } from "@/app/dashboard/utilities";

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

// Updated MacOSFolder component
function MacOSFolder({ folder }: { folder: EnhancedProjectFolder }) {
  return <MacOSFolderIcon color={folder.color} folder={folder} />;
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
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

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

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMoveDialogOpen(true);
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

  const handleMoveComplete = (updatedFolders: EnhancedProjectFolder[]) => {
    // Update the local folder state instead of refreshing
    onFoldersUpdate(updatedFolders);
  };
  if (viewMode === "list") {
    return (
      <>
        <Card className=" cursor-pointer group ">
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

                      <DropdownMenuItem onClick={handleMove}>
                        <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
                        Move Folder
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

                  <ChevronRight className="h-5 w-5 " />
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

        <MoveFolderDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          folder={folder}
          allFolders={allFolders}
          projectId={projectId}
          onMoveComplete={handleMoveComplete} // Now passes updated folders
        />
      </>
    );
  }

  return (
    <>
      <div className="cursor-pointer group relative">
        <Link href={`/dashboard/projects/${projectId}/folders/${folder.id}`}>
          {/* macOS-style Folder */}
          <div className="transition-transform duration-200 ">
            <MacOSFolder folder={folder} />
          </div>

          {/* Folder Name */}
          <div className="mt-2 text-center">
            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors px-1">
              {folder.name}
            </h3>
            {folder.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 px-1">
                {folder.description}
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-1 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {folder.stats?.totalSize && folder.stats.totalSize > 0 && (
                <span>{formatFileSize(folder.stats.totalSize)}</span>
              )}
              <span>•</span>
              <span>{formatDate(folder.created_at)}</span>
            </div>
          </div>
        </Link>

        {/* Folder Actions */}
        <div className="absolute top-1 right-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleMove}>
                <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
                Move Folder
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

      <MoveFolderDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        folder={folder}
        allFolders={allFolders}
        projectId={projectId}
        onMoveComplete={handleMoveComplete}
      />
    </>
  );
}