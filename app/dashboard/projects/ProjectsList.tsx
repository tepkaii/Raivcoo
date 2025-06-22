// app/dashboard/projects/ProjectsList.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
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
  Filter,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatFullDate } from "../components/libs";

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
  stats: ProjectStats;
  project_media: MediaFile[];
}

interface ProjectsListProps {
  projects: Project[];
}

type ViewMode = "grid" | "list";
type SortBy = "updated" | "created" | "name" | "files";
type SortOrder = "asc" | "desc";

export function ProjectsList({ projects }: ProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterBy, setFilterBy] = useState<"all" | "hasMedia" | "empty">("all");

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProjectStats = (project: Project) => {
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
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first project workspace to get started.
          </p>
          <Link href="/dashboard/projects/new">
            <RevButtons className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Project
            </RevButtons>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filterBy}
                onValueChange={(value: typeof filterBy) => setFilterBy(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="hasMedia">With Media</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: typeof sortBy) => setSortBy(value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="files">File Count</SelectItem>
                </SelectContent>
              </Select>

              <RevButtons
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
              </RevButtons>

              <div className="flex border rounded-md">
                <RevButtons
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </RevButtons>
                <RevButtons
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </RevButtons>
              </div>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedProjects.length} of {projects.length}{" "}
              projects
            </p>
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
        <div className="space-y-2">
          {filteredAndSortedProjects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

// Media Gallery Thumbnail Component
function MediaThumbnail({ media }: { media: MediaFile }) {
  return (
    <div className="relative bg-black rounded overflow-hidden aspect-video">
      {media.file_type === "image" ? (
        <img
          src={media.r2_url}
          alt={media.original_filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <video
          src={media.r2_url}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
      )}
    </div>
  );
}

// Empty Gallery Placeholder
function EmptyGallery() {
  return (
    <div className="aspect-video bg-black rounded flex items-center justify-center">
      <div className="text-center">
        <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs ">No media</p>
      </div>
    </div>
  );
}

// Media Gallery Component
function MediaGallery({ project }: { project: Project }) {
  // Get first 4 media files for thumbnail display
  const displayMedia = project.project_media?.slice(0, 4) || [];
  const hasMedia = displayMedia.length > 0;

  if (!hasMedia) {
    return <EmptyGallery />;
  }

  // Multiple media items - create grid
  const getGridLayout = (count: number) => {
    switch (count) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2 grid-rows-2";
      case 4:
      default:
        return "grid-cols-2 grid-rows-2";
    }
  };

  return (
    <div
      className={`grid gap-1 aspect-video ${getGridLayout(displayMedia.length)} relative`}
    >
      {displayMedia.map((media, index) => {
        // For 3 items, make first item span 2 rows
        const className =
          displayMedia.length === 3 && index === 0 ? "row-span-2" : "";

        return (
          <div key={media.id} className={className}>
            <MediaThumbnail media={media} />
          </div>
        );
      })}

      {/* Show remaining count if more than 4 items */}
      {project.stats.totalFiles > 4 && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          +{project.stats.totalFiles - 4} more
        </div>
      )}
    </div>
  );
}

// Grid Card Component
function ProjectCard({ project }: { project: Project }) {
  const stats = getProjectStats(project);

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden ">
        {/* Media Thumbnail Gallery */}
        <div className="relative bg-black">
          <MediaGallery project={project} />
        </div>

        {/* Content */}
        <div className="p-4 bg-primary-foreground">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
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
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(project.created_at)}</span>
              </div>
              <span>Updated {formatDate(project.updated_at)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// List Item Component (unchanged but simplified)
function ProjectListItem({ project }: { project: Project }) {
  const stats = getProjectStats(project);

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="hover:shadow-sm transition-all duration-200 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                    {project.name}
                  </h3>
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
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
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

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}