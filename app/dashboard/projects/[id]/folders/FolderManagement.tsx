// aa/app/dashboard/projects/[id]/folders/FolderManagement.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Grid, List, Upload, MoreHorizontal } from "lucide-react";
import { ProjectFolder, MediaFile } from "@/app/dashboard/lib/types";
import { FolderCard } from "./components/FolderCard";
import { CreateFolderDialog } from "./components/CreateFolderDialog";
import { FolderUpload } from "./components/FolderUpload";
import { toast } from "@/hooks/use-toast";
import { FolderIcon, HomeIcon } from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface FolderManagementProps {
  projectId: string;
  projectName: string;
  folders: EnhancedProjectFolder[];
  userRole?: "viewer" | "reviewer" | "collaborator" | null;
  isOwner: boolean;
  authenticatedUser?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  } | null;
}

export function FolderManagement({
  projectId,
  projectName,
  folders: initialFolders,
  userRole,
  isOwner,
  authenticatedUser,
}: FolderManagementProps) {
  const [folders, setFolders] =
    useState<EnhancedProjectFolder[]>(initialFolders);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderUploadOpen, setFolderUploadOpen] = useState(false);

  // Filter folders based on search
  const filteredFolders = folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get root folders (no parent)
  const rootFolders = filteredFolders.filter(
    (folder) => !folder.parent_folder_id
  );

  const handleFolderUploadComplete = (newFiles: any[], newFolders: any[]) => {
    setFolders([...folders, ...newFolders]);
    setFolderUploadOpen(false);
    toast({
      title: "Upload Complete",
      description: `Uploaded ${newFiles.length} files in ${newFolders.length} folders`,
      variant: "green",
    });
  };

  const handleFoldersUpdate = (updatedFolders: EnhancedProjectFolder[]) => {
    setFolders(updatedFolders);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0">
        <div className="flex items-center h-full flex-1 min-w-0">
          <div className="flex items-center justify-center border-l border-r h-full mr-3">
            <div className="flex items-center mr-2 ml-2 h-full">
              <SidebarTrigger />
            </div>
          </div>

          <div className="border-r flex items-center h-full flex-1 min-w-0">
            <div className="mr-3 flex items-center gap-2 flex-1 min-w-0">
              {/* Mobile breadcrumb - simplified */}
              <div className="flex items-center gap-2 flex-1 min-w-0 sm:hidden">
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Folders</span>
                </div>
              </div>

              {/* Desktop breadcrumb */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href={`/dashboard/projects/${projectId}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span className="text-sm">{projectName}</span>
                  </Button>
                </Link>
                <span className="text-muted-foreground">/</span>
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Folders</span>
                </div>
              </div>

              {!isOwner && userRole && (
                <Badge
                  variant="outline"
                  className="text-sm hidden sm:inline-flex"
                >
                  {userRole}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-r flex items-center h-full flex-shrink-0">
            <div className="flex items-center gap-2 mx-3">
              {/* Mobile: Dropdown menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFolderUploadOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Regular buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={() => setCreateFolderOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Folder
                </Button>
                <Button
                  onClick={() => setFolderUploadOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Folder
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search and View Controls */}
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Folders Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {rootFolders.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No folders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first folder to organize your project files
            </p>
            <Button onClick={() => setCreateFolderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2"
            }
          >
            {rootFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                projectId={projectId}
                viewMode={viewMode}
                onFoldersUpdate={handleFoldersUpdate}
                allFolders={folders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        projectId={projectId}
        onFolderCreated={(newFolder) => {
          setFolders([...folders, newFolder]);
          setCreateFolderOpen(false);
        }}
      />

      {/* Folder Upload Dialog */}
      <FolderUpload
        open={folderUploadOpen}
        onOpenChange={setFolderUploadOpen}
        projectId={projectId}
        onUploadComplete={handleFolderUploadComplete}
      />
    </div>
  );
}
