// app/dashboard/projects/components/MainProjectsList.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  FileVideo,
  Image as ImageIcon,
  HardDrive,
  ChevronRight,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import {
  formatDate,
  formatFileSize,
  formatFullDate,
  getFileCategory,
} from "../../utilities";
import { Button } from "@/components/ui/button";
import { MediaFile } from "../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { deleteProject, updateProject } from "../../lib/actions";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { EditProjectDialog } from "./EditProjectDialog.";
import {
  ClockIcon,
  FolderIcon,
  FunnelIcon,
  Cog6ToothIcon,
  TrashIcon,
  UserGroupIcon,
  BellIcon,
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";

interface ProjectStats {
  totalFiles: number;
  totalSize: number;
  videoCount: number;
  imageCount: number;
  lastUpload: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  editor_id: string;
  notifications_enabled: boolean;
  memberNotificationsEnabled?: boolean;
  stats: ProjectStats;
  project_media: MediaFile[];
  isOwner: boolean;
  userRole: "owner" | "viewer" | "reviewer" | "collaborator";
}

interface MainProjectsListProps {
  projects: Project[];
  currentUserId: string;
}

type ViewMode = "grid" | "list";
type SortBy = "updated" | "created" | "name" | "files";
type SortOrder = "asc" | "desc";
type FilterBy = "all" | "hasMedia" | "empty" | "owned" | "member";

export function MainProjectsList({
  projects,
  currentUserId,
}: MainProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply ownership/membership filter
    if (filterBy === "owned") {
      filtered = filtered.filter((project) => project.isOwner);
    } else if (filterBy === "member") {
      filtered = filtered.filter((project) => !project.isOwner);
    }

    // Apply media filter
    if (filterBy === "hasMedia") {
      filtered = filtered.filter((project) => project.stats.totalFiles > 0);
    } else if (filterBy === "empty") {
      filtered = filtered.filter((project) => project.stats.totalFiles === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "updated":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "files":
          comparison = a.stats.totalFiles - b.stats.totalFiles;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [projects, searchQuery, filterBy, sortBy, sortOrder]);

  if (projects.length === 0) {
    return (
      <div className="px-4">
        <Card>
          <CardContent className="py-16 text-center">
            <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project workspace to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      {/* Filters and Controls */}
      <Card className="bg-transparent border-transparent">
        <CardContent className="p-4">
          <div className="flex justify-end flex-col lg:flex-row gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filterBy}
                onValueChange={(value: typeof filterBy) => setFilterBy(value)}
              >
                <SelectTrigger>
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="owned">My Projects</SelectItem>
                  <SelectItem value="member">Team Projects</SelectItem>
                  <SelectItem value="hasMedia">With Media</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: typeof sortBy) => setSortBy(value)}
              >
                <SelectTrigger>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="files">File Count</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>

              <div className="flex">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Display */}
      {filteredAndSortedProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            width: "100%",
          }}
        >
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="gap-4 flex flex-col">
          {filteredAndSortedProjects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ FIXED MediaThumbnail Component with proper fallbacks
function MediaThumbnail({ media }: { media: MediaFile }) {
  const fileCategory = getFileCategory(media.file_type, media.mime_type);

  // ✅ FIX: Only use thumbnail_r2_url, don't fallback to r2_url for videos
  const getThumbnailUrl = () => {
    if (media.thumbnail_r2_url && media.thumbnail_r2_url.trim() !== "") {
      return media.thumbnail_r2_url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  // Render based on file type and thumbnail availability
  const renderContent = () => {
    switch (fileCategory) {
      case "image":
        // ✅ FIX: For images - FIXED SIZE with object-cover
        const imageUrl = thumbnailUrl || media.r2_url;
        return (
          <img
            src={imageUrl}
            alt={media.original_filename}
            className="w-full h-full object-cover"
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        );

      case "video":
        if (thumbnailUrl) {
          // ✅ FIX: Use video thumbnail - FIXED SIZE with object-cover
          return (
            <img
              src={thumbnailUrl}
              alt={`${media.original_filename} thumbnail`}
              className="w-full h-full object-cover"
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          );
        } else {
          // ✅ FIX: Video fallback with gradient and icon - FIXED SIZE
          return (
            <div
              className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "100%",
              }}
            >
              <VideoCameraIcon className="h-6 w-6 text-white/80" />
            </div>
          );
        }

      case "audio":
        // ✅ FIX: Audio fallback - FIXED SIZE
        return (
          <div
            className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-800 flex items-center justify-center"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            <MusicalNoteIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      case "svg":
        // ✅ FIX: SVG fallback - FIXED SIZE
        return (
          <div
            className="w-full h-full bg-gradient-to-br from-green-600 to-teal-800 flex items-center justify-center"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            <CodeBracketIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      case "document":
        // ✅ FIX: Document fallback - FIXED SIZE
        return (
          <div
            className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            <DocumentIcon className="h-6 w-6 text-white/80" />
          </div>
        );

      default:
        // ✅ FIX: Unknown file type fallback - FIXED SIZE
        return (
          <div
            className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            <DocumentIcon className="h-6 w-6 text-white/80" />
          </div>
        );
    }
  };

  return (
    <div
      className="w-full h-full bg-black rounded-lg overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        position: "relative",
      }}
    >
      {renderContent()}
    </div>
  );
}

// Empty Gallery Placeholder
function EmptyGallery() {
  return (
    <div className="aspect-video bg-black  flex items-center justify-center">
      <div className="text-center text-white/60">
        <FolderIcon className="h-8 w-8 mx-auto mb-2" />
        <p className="text-xs">No media</p>
      </div>
    </div>
  );
}

// ✅ FIXED MediaGallery Component with proper aspect ratio control
function MediaGallery({ project }: { project: Project }) {
  // Get first 4 media files for thumbnail display
  const displayMedia = project.project_media?.slice(0, 4) || [];
  const hasMedia = displayMedia.length > 0;

  if (!hasMedia) {
    return <EmptyGallery />;
  }

  const mediaCount = displayMedia.length;

  // Dynamic layout based on media count
  const renderGallery = () => {
    switch (mediaCount) {
      case 1:
        // ✅ FIX: Single media - ENFORCED aspect ratio
        return (
          <div
            className="w-full h-full"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            <MediaThumbnail media={displayMedia[0]} />
          </div>
        );

      case 2:
        // ✅ FIX: Two media - ENFORCED grid sizes
        return (
          <div
            className="grid grid-cols-2 gap-1 w-full h-full"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            {displayMedia.map((media) => (
              <div
                key={media.id}
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100%",
                }}
              >
                <MediaThumbnail media={media} />
              </div>
            ))}
          </div>
        );

      case 3:
        // ✅ FIX: Three media - ENFORCED grid sizes
        return (
          <div
            className="grid grid-cols-2 gap-1 w-full h-full"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            {/* First media takes full height on left */}
            <div
              className="w-full h-full"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "100%",
              }}
            >
              <MediaThumbnail media={displayMedia[0]} />
            </div>
            {/* Two media stacked on right */}
            <div
              className="grid grid-rows-2 gap-1 h-full"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "100%",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100%",
                }}
              >
                <MediaThumbnail media={displayMedia[1]} />
              </div>
              <div
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100%",
                }}
              >
                <MediaThumbnail media={displayMedia[2]} />
              </div>
            </div>
          </div>
        );

      case 4:
      default:
        // ✅ FIX: Four or more media - ENFORCED 2x2 grid
        return (
          <div
            className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
            }}
          >
            {displayMedia.slice(0, 4).map((media) => (
              <div
                key={media.id}
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100%",
                }}
              >
                <MediaThumbnail media={media} />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div
      className="px-2 py-3 relative"
      style={{
        aspectRatio: "16/9",
        width: "100%",
        minHeight: "0",
      }}
    >
      <div
        className="w-full h-full"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "100%",
        }}
      >
        {renderGallery()}
      </div>

      {/* Show remaining count if more than 4 items */}
      {project.stats.totalFiles > 4 && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          +{project.stats.totalFiles - 4} more
        </div>
      )}
    </div>
  );
}

// Role Badge Component
function RoleBadge({ role, isOwner }: { role: string; isOwner: boolean }) {
  if (isOwner) return null;

  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className={`text-xs flex items-center gap-2`}>
        <UserGroupIcon className="h-3 w-3" />
        {role}
      </Badge>
    </div>
  );
}

// Grid Card Component
function ProjectCard({ project }: { project: Project }) {
  const stats = getProjectStats(project);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden relative">
      <Link href={`/dashboard/projects/${project.id}`}>
        {/* Media Thumbnail Gallery */}
        <div className="relative bg-gradient-to-br from-blue-300 to-blue-800">
          <MediaGallery project={project} />
          {/* Role indicator for team projects */}
          {!project.isOwner && (
            <div className="absolute top-3 left-2">
              <RoleBadge role={project.userRole} isOwner={project.isOwner} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 ">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
            </div>

            {/* Media Stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {project.stats.totalFiles > 0 ? (
                  <span className="text-muted-foreground">
                    {project.stats.totalFiles}{" "}
                    {project.stats.totalFiles === 1 ? "file" : "files"}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Empty project
                  </span>
                )}
              </div>

              {project.stats.totalSize > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  <span>{stats.sizeText}</span>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(project.created_at)}</span>
              </div>
              <span>Updated {formatDate(project.updated_at)}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Project Actions - Show for both owners and members */}
      <div className="absolute top-2 right-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {project.isOwner ? (
              // Owner menu
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setEditDialogOpen(true);
                  }}
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </>
            ) : (
              // Member menu
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setEditDialogOpen(true);
                }}
              >
                <BellIcon className="h-4 w-4 mr-2" />
                Notification Settings
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog - Show for both owners and members */}
      <EditProjectDialog
        project={project}
        onUpdateProject={updateProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete Dialog - Only for owners */}
      {project.isOwner && (
        <DeleteProjectDialog
          project={project}
          onDeleteProject={deleteProject}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </Card>
  );
}

// List Item Component
function ProjectListItem({ project }: { project: Project }) {
  const stats = getProjectStats(project);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <Card className="hover:shadow-sm bg-primary-foreground transition-all duration-200 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                    {project.name}
                  </h3>
                  <RoleBadge
                    role={project.userRole}
                    isOwner={project.isOwner}
                  />
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {project.stats.videoCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <FileVideo className="h-3 w-3" />
                      {project.stats.videoCount}
                    </Badge>
                  )}
                  {project.stats.imageCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {project.stats.imageCount}
                    </Badge>
                  )}
                  {project.stats.totalFiles === 0 && (
                    <Badge variant="secondary">Empty</Badge>
                  )}
                </div>

                <div className="hidden sm:block">
                  {stats.sizeText !== "0 B" && stats.sizeText}
                </div>

                <div className="hidden md:block">
                  {formatFullDate(project.updated_at)}
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 ml-4">
            {/* Project Actions Dropdown - Show for both owners and members */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {project.isOwner ? (
                  // Owner menu
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setEditDialogOpen(true);
                      }}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </>
                ) : (
                  // Member menu
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setEditDialogOpen(true);
                    }}
                  >
                    <BellIcon className="h-4 w-4 mr-2" />
                    Notification Settings
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </div>

        {/* Edit Dialog - Show for both owners and members */}
        <EditProjectDialog
          project={project}
          onUpdateProject={updateProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Delete Dialog - Only for owners */}
        {project.isOwner && (
          <DeleteProjectDialog
            project={project}
            onDeleteProject={deleteProject}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getProjectStats(project: Project) {
  const { stats } = project;
  return {
    mediaText:
      stats.totalFiles === 0
        ? "No files"
        : stats.totalFiles === 1
          ? "1 file"
          : `${stats.totalFiles} files`,
    sizeText: formatFileSize(stats.totalSize),
    lastActivity: stats.lastUpload
      ? formatDate(stats.lastUpload)
      : formatDate(project.updated_at),
  };
}

