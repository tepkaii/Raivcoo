// app/dashboard/projects/[id]/components/Media/MediaGrid.tsx
// @ts-nocheck
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  Loader2,
  Crown,
  Plus,
  Grid,
  List,
  LinkIcon,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { MediaCard } from "./MediaCard";
import { MediaDialogs } from "./MediaDialogs";
import { CreateFolderDialog } from "../../folders/components/CreateFolderDialog";
import { FolderCard } from "../../folders/components/FolderCard";
import { ProjectReferencesDialog } from "../Dialogs/ReferencesDialog";
import {
  MediaFile,
  OrganizedMedia,
  ReviewLink,
  ProjectFolder,
} from "@/app/dashboard/types";
import { updateProjectReferencesAction } from "../../lib/GeneralActions";
import { UploadValidator, getUploadValidatorData } from "../../lib/UploadLogic";
import { DocumentDuplicateIcon, FolderIcon } from "@heroicons/react/24/solid";

// Import all handlers
import {
  createUploadHandlers,
  createMediaHandlers,
  createReviewLinkHandlers,
  createVersionHandlers,
  createFolderHandlers,
} from "../../handlers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define enhanced folder interface here
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

interface MediaGridProps {
  mediaFiles: MediaFile[];
  reviewLinks: ReviewLink[];
  selectedMedia: MediaFile | null;
  onMediaSelect: (media: MediaFile | null) => void;
  onMediaUpdated: (newFiles: MediaFile[]) => void;
  onReviewLinksUpdated: (newLinks: ReviewLink[]) => void;
  projectId: string;
  project: any;
  userPermissions: {
    canUpload: boolean;
    canDelete: boolean;
    canEditStatus: boolean;
    canCreateReviewLinks: boolean;
  };
  currentFolderId?: string;
  folders?: EnhancedProjectFolder[]; // Add enhanced folders prop
  onFoldersUpdate?: (folders: EnhancedProjectFolder[]) => void; // Add folder update handler
}
const useContainerWidth = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial width
    updateWidth();

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(updateWidth);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, containerWidth };
};
export function MediaGrid({
  mediaFiles,
  reviewLinks,
  selectedMedia,
  onMediaSelect,
  onMediaUpdated,
  onReviewLinksUpdated,
  projectId,
  project,
  userPermissions,
  currentFolderId,
  folders: passedFolders, // Receive folders from parent
  onFoldersUpdate: passedOnFoldersUpdate, // Receive folder update handler
}: MediaGridProps) {
  const router = useRouter();

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadValidator, setUploadValidator] =
    useState<UploadValidator | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const { containerRef, containerWidth } = useContainerWidth();

  const getGridClasses = (mediaCount: number, width: number) => {
    if (viewMode === "list") return "space-y-2";

    const isSingleItem = mediaCount === 1;
    let columns = 1;

    if (isSingleItem) {
      // Single item: more conservative breakpoints (matches md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
      if (width >= 1280)
        columns = 4; // xl breakpoint
      else if (width >= 1024)
        columns = 3; // lg breakpoint
      else if (width >= 768)
        columns = 2; // md breakpoint
      else columns = 1;
    } else {
      // Multiple items: same breakpoints as single item (they were identical in original)
      if (width >= 1280)
        columns = 4; // xl breakpoint
      else if (width >= 1024)
        columns = 3; // lg breakpoint
      else if (width >= 768)
        columns = 2; // md breakpoint
      else columns = 1;
    }

    const gridColsClass = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
    }[columns];

    return `grid gap-4 ${gridColsClass}`;
  };
  // Use passed folders if available, otherwise load them
  const [folders, setFolders] = useState<EnhancedProjectFolder[]>(
    passedFolders || []
  );
  const [isLoadingFolders, setIsLoadingFolders] = useState(!passedFolders);

  // UI states
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());
  const [draggedMedia, setDraggedMedia] = useState<MediaFile | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "folders">("files");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editNameDialog, setEditNameDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isUpdating: boolean;
  }>({ open: false, isUpdating: false });
  // Dialog states - keeping existing dialog states...
  const [createLinkDialog, setCreateLinkDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  }>({ open: false, isCreating: false, showSuccess: false });

  const [viewLinksDialog, setViewLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }>({ open: false, links: [], isLoading: false });

  const [manageLinksDialog, setManageLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }>({ open: false, links: [], isLoading: false });

  const [versionManagerDialog, setVersionManagerDialog] = useState<{
    open: boolean;
    media?: OrganizedMedia;
    isUpdating: boolean;
  }>({ open: false, isUpdating: false });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  }>({ open: false, isDeleting: false });

  const [referencesDialog, setReferencesDialog] = useState<{
    open: boolean;
  }>({ open: false });
  // Add this handler
  const handleRenameMedia = (mediaFile: MediaFile) => {
    setEditNameDialog({
      open: true,
      mediaFile,
      isUpdating: false,
    });
  };
  // Update local folders when passed folders change
  useEffect(() => {
    if (passedFolders) {
      setFolders(passedFolders);
      setIsLoadingFolders(false);
    }
  }, [passedFolders]);

  // Create all handlers
  const uploadHandlers = createUploadHandlers(
    projectId,
    currentFolderId,
    mediaFiles,
    onMediaUpdated,
    setIsUploading,
    setUploadProgress,
    setDraggedOver,
    setDraggedMedia,
    setExpandedMedia
  );

  const mediaHandlers = createMediaHandlers(
    projectId,
    mediaFiles,
    reviewLinks,
    onMediaUpdated,
    onReviewLinksUpdated,
    versionManagerDialog,
    setVersionManagerDialog,
    setDeleteDialog
  );

  const reviewLinkHandlers = createReviewLinkHandlers(
    projectId,
    reviewLinks,
    onReviewLinksUpdated,
    setCreateLinkDialog,
    setViewLinksDialog,
    setManageLinksDialog
  );

  const versionHandlers = createVersionHandlers(
    mediaFiles,
    onMediaUpdated,
    setExpandedMedia,
    versionManagerDialog,
    setVersionManagerDialog
  );

  // Create folder handlers with proper update logic
  const folderHandlers = createFolderHandlers(
    projectId,
    folders.map((f) => ({ ...f, media_files: undefined, stats: undefined })), // Convert to base ProjectFolder for handler
    (newFolders) => {
      // Convert back to enhanced folders when updating
      const enhancedFolders = newFolders.map((folder) => {
        const existingFolder = folders.find((f) => f.id === folder.id);
        return (
          existingFolder || {
            ...folder,
            media_files: [],
            stats: {
              totalFiles: 0,
              totalSize: 0,
              videoCount: 0,
              imageCount: 0,
              lastUpload: null,
            },
          }
        );
      });
      setFolders(enhancedFolders);
      // If parent provides update handler, use it
      if (passedOnFoldersUpdate) {
        passedOnFoldersUpdate(enhancedFolders);
      }
    },
    setIsLoadingFolders,
    setCreateFolderOpen
  );

  // Load folders only if not passed from parent
  useEffect(() => {
    if (!passedFolders) {
      folderHandlers.loadFolders();
    }
  }, [projectId, passedFolders]);

  // Initialize upload validator
  useEffect(() => {
    const initializeValidator = async () => {
      try {
        setIsLoadingLimits(true);
        const { subscription, projectUsage } = await getUploadValidatorData(
          projectId,
          mediaFiles
        );
        const validator = new UploadValidator(subscription, projectUsage);
        setUploadValidator(validator);
      } catch (error) {
        console.error("Failed to initialize upload validator:", error);
        toast({
          title: "Warning",
          description:
            "Could not load upload limits. Upload may be restricted.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLimits(false);
      }
    };

    initializeValidator();
  }, [projectId, mediaFiles]);

  // Re-calculate project usage when media files change
  useEffect(() => {
    if (uploadValidator) {
      const updateValidator = async () => {
        try {
          const { subscription, projectUsage } = await getUploadValidatorData(
            projectId,
            mediaFiles
          );
          const newValidator = new UploadValidator(subscription, projectUsage);
          setUploadValidator(newValidator);
        } catch (error) {
          console.error("Failed to update upload validator:", error);
        }
      };

      updateValidator();
    }
  }, [mediaFiles.length, projectId, uploadValidator]);

  // Custom folder creation handler that works with enhanced folders
  const handleFolderCreated = (newFolder: ProjectFolder) => {
    // Convert to enhanced folder format
    const enhancedNewFolder: EnhancedProjectFolder = {
      ...newFolder,
      media_files: [],
      stats: {
        totalFiles: 0,
        totalSize: 0,
        videoCount: 0,
        imageCount: 0,
        lastUpload: null,
      },
    };

    const updatedFolders = [...folders, enhancedNewFolder];
    setFolders(updatedFolders);

    if (passedOnFoldersUpdate) {
      passedOnFoldersUpdate(updatedFolders);
    }

    setCreateFolderOpen(false);
  };

  // Filter media files based on current folder and search
  const filteredMediaFiles = React.useMemo(() => {
    let filtered = mediaFiles;

    // Filter by folder
    if (currentFolderId) {
      filtered = filtered.filter((file) => file.folder_id === currentFolderId);
    } else {
      filtered = filtered.filter((file) => !file.folder_id);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((file) =>
        file.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [mediaFiles, currentFolderId, searchQuery]);

  // Filter folders based on current folder and search
  const filteredFolders = React.useMemo(() => {
    let filtered = folders;

    // Filter by parent folder
    if (currentFolderId) {
      filtered = filtered.filter(
        (folder) => folder.parent_folder_id === currentFolderId
      );
    } else {
      filtered = filtered.filter((folder) => !folder.parent_folder_id);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          folder.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [folders, currentFolderId, searchQuery]);

  // [Keep all the existing organized media logic, file handlers, etc.]

  // Organize media files
  const organizedMedia = React.useMemo((): OrganizedMedia[] => {
    const parentMediaMap = new Map<string, MediaFile>();
    const childVersionsMap = new Map<string, MediaFile[]>();
    const orphanedVersions: MediaFile[] = [];

    filteredMediaFiles.forEach((file) => {
      if (!file.parent_media_id) {
        parentMediaMap.set(file.id, file);
        if (!childVersionsMap.has(file.id)) {
          childVersionsMap.set(file.id, []);
        }
      } else {
        const parentExists = filteredMediaFiles.some(
          (m) => m.id === file.parent_media_id
        );

        if (parentExists) {
          if (!childVersionsMap.has(file.parent_media_id)) {
            childVersionsMap.set(file.parent_media_id, []);
          }
          childVersionsMap.get(file.parent_media_id)!.push(file);
        } else {
          orphanedVersions.push({
            ...file,
            parent_media_id: null,
            version_number: 1,
            is_current_version: true,
          });
        }
      }
    });

    // Handle orphaned versions
    orphanedVersions.forEach((orphan) => {
      parentMediaMap.set(orphan.id, orphan);
      if (!childVersionsMap.has(orphan.id)) {
        childVersionsMap.set(orphan.id, []);
      }
    });

    const result: OrganizedMedia[] = [];

    parentMediaMap.forEach((parentMedia, parentId) => {
      const versions = childVersionsMap.get(parentId) || [];

      const sortedVersions = versions.sort(
        (a, b) => a.version_number - b.version_number
      );

      let currentVersion = parentMedia;

      if (parentMedia.is_current_version) {
        currentVersion = parentMedia;
      } else {
        const currentVersionFromChildren = sortedVersions.find(
          (v) => v.is_current_version
        );

        if (currentVersionFromChildren) {
          currentVersion = currentVersionFromChildren;
        } else {
          const allInGroup = [parentMedia, ...sortedVersions];
          const highestVersion = allInGroup.sort(
            (a, b) => b.version_number - a.version_number
          )[0];
          currentVersion = highestVersion;
        }
      }

      const hasReviewLinks = reviewLinks.some(
        (link) => link.media_id === parentId
      );

      const organizedMediaItem: OrganizedMedia = {
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
        version_name: parentMedia.version_name,
        parent_media_id: parentMedia.parent_media_id,
        status: parentMedia.status,
        thumbnail_r2_url: parentMedia.thumbnail_r2_url,
        versions: sortedVersions,
        currentVersion: currentVersion,
        hasReviewLinks: hasReviewLinks,
      };

      result.push(organizedMediaItem);
    });

    return result.sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  }, [filteredMediaFiles, reviewLinks]);

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    uploadHandlers.handleFileInputChange(event, uploadValidator);
  };

  // Handle drop functionality
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length === 0) return;

      if (!uploadValidator) {
        toast({
          title: "Upload Error",
          description: "Upload system not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (draggedOver) {
        await uploadHandlers.uploadFilesHandler(
          acceptedFiles,
          draggedOver,
          uploadValidator
        );
      } else {
        await uploadHandlers.uploadFilesHandler(
          acceptedFiles,
          undefined,
          uploadValidator
        );
      }
    },
    [draggedOver, uploadValidator, uploadHandlers]
  );
  const handleMediaUpdated = useCallback(
    (updatedMediaFiles: MediaFile[]) => {
      if (updatedMediaFiles.length === 1) {
        // Single file update (like rename) - update just that file
        const updatedFile = updatedMediaFiles[0];
        const newMediaFiles = mediaFiles.map((existingFile) =>
          existingFile.id === updatedFile.id ? updatedFile : existingFile
        );
        onMediaUpdated(newMediaFiles);
      } else {
        // Multiple files update - use the original logic
        const updatedMap = new Map(
          updatedMediaFiles.map((file) => [file.id, file])
        );

        const newMediaFiles = mediaFiles.map((existingFile) => {
          if (updatedMap.has(existingFile.id)) {
            return updatedMap.get(existingFile.id)!;
          }
          return existingFile;
        });

        const newFiles = updatedMediaFiles.filter(
          (updated) =>
            !mediaFiles.some((existing) => existing.id === updated.id)
        );

        onMediaUpdated([...newMediaFiles, ...newFiles]);
      }
    },
    [mediaFiles, onMediaUpdated]
  );

  // Get upload status
  const uploadStatus = uploadValidator?.getUploadStatus();

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header and all the existing UI remains exactly the same */}
      <div className="p-4 border-b flex-shrink-0 min-h-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "files" | "folders")}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-[140px] sm:w-[200px] grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="folders">Folders</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {/* View Mode - Hidden on mobile */}
              {containerWidth >= 600 && (
                <div className="flex items-center gap-1">
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
              )}

              {/* Primary action - Always visible */}
              <Button
                onClick={() =>
                  userPermissions.canUpload &&
                  uploadStatus?.canUpload &&
                  document.getElementById("file-input")?.click()
                }
                disabled={
                  !userPermissions.canUpload ||
                  isUploading ||
                  !uploadStatus?.canUpload ||
                  isLoadingLimits
                }
                className="flex items-center gap-2"
                size="icon-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {containerWidth >= 600 && <span>Uploading...</span>}
                  </>
                ) : !uploadStatus?.canUpload ? (
                  <>
                    <Crown className="h-4 w-4" />
                    {containerWidth >= 600 && <span>Upgrade Storage</span>}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {containerWidth >= 600 && <span>Upload</span>}
                  </>
                )}
              </Button>

              {/* Overflow Menu for smaller screens */}
              {containerWidth < 600 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewMode("grid")}>
                      <Grid className="h-4 w-4 mr-2" />
                      Grid View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode("list")}>
                      <List className="h-4 w-4 mr-2" />
                      List View
                    </DropdownMenuItem>
                    {activeTab === "folders" && userPermissions.canUpload && (
                      <DropdownMenuItem
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Folder
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setReferencesDialog({ open: true })}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      References
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Secondary actions - Hidden on mobile, shown in dropdown */}
              {containerWidth >= 600 && (
                <div className="flex items-center gap-2">
                  {activeTab === "folders" && userPermissions.canUpload && (
                    <Button
                      onClick={() => setCreateFolderOpen(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {containerWidth >= 600 && <span>New Folder</span>}
                    </Button>
                  )}

                  <Button
                    onClick={() => setReferencesDialog({ open: true })}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {containerWidth >= 600 && <span>References</span>}
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Uploading files...
                </span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          )}

          {/* Tab Content */}
          <TabsContent value="files" className="min-h-screen">
            <div className="flex-1 overflow-y-auto min-h-screen ">
              {organizedMedia.length === 0 && filteredFolders.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg">No files found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Upload files to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6" ref={containerRef}>
                  {/* Folders Section */}
                  {filteredFolders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Folders</h3>
                      <div
                        className={getGridClasses(
                          filteredFolders.length,
                          containerWidth
                        )}
                      >
                        {filteredFolders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            projectId={projectId}
                            viewMode={viewMode}
                            onFoldersUpdate={(updatedFolders) => {
                              setFolders(updatedFolders);
                              if (passedOnFoldersUpdate) {
                                passedOnFoldersUpdate(updatedFolders);
                              }
                            }}
                            allFolders={folders}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Files Section - keeping existing media card logic */}
                  {organizedMedia.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Files</h3>
                      <div
                        className={getGridClasses(
                          organizedMedia.length,
                          containerWidth
                        )}
                      >
                        {organizedMedia.map((media) => (
                          <MediaCard
                            key={media.id}
                            media={media}
                            selectedMedia={selectedMedia}
                            expandedMedia={expandedMedia}
                            draggedOver={draggedOver}
                            draggedMedia={draggedMedia}
                            projectId={projectId}
                            onMediaSelect={onMediaSelect}
                            onExpandToggle={(mediaId) => {
                              const newExpanded = new Set(expandedMedia);
                              if (expandedMedia.has(mediaId)) {
                                newExpanded.delete(mediaId);
                              } else {
                                newExpanded.add(mediaId);
                              }
                              setExpandedMedia(newExpanded);
                            }}
                            onDragStart={(media) => setDraggedMedia(media)}
                            onDragEnd={() => setDraggedMedia(null)}
                            onDragOver={(mediaId) => setDraggedOver(mediaId)}
                            onDragLeave={() => setDraggedOver(null)}
                            onDrop={(targetId, files) => {
                              if (files.length > 0) {
                                if (!uploadValidator) {
                                  toast({
                                    title: "Upload Error",
                                    description:
                                      "Upload system not ready. Please try again.",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                if (!uploadValidator.canUploadFiles(files)) {
                                  uploadValidator.showUploadError(files);
                                  return;
                                }

                                uploadHandlers.uploadFilesHandler(
                                  files,
                                  targetId,
                                  uploadValidator
                                );
                              } else if (draggedMedia) {
                                versionHandlers.handleCreateVersion(
                                  targetId,
                                  draggedMedia.id
                                );
                              }
                              setDraggedOver(null);
                              setDraggedMedia(null);
                            }}
                            onVersionReorder={
                              versionHandlers.handleVersionReorder
                            }
                            onCreateReviewLink={(mediaFile) =>
                              setCreateLinkDialog({
                                open: true,
                                mediaFile,
                                isCreating: false,
                                showSuccess: false,
                              })
                            }
                            onViewReviewLinks={
                              reviewLinkHandlers.handleViewReviewLinks
                            }
                            onManageReviewLinks={
                              reviewLinkHandlers.handleManageReviewLinks
                            }
                            onDeleteMedia={(mediaFile) =>
                              setDeleteDialog({
                                open: true,
                                mediaFile,
                                isDeleting: false,
                              })
                            }
                            onOpenVersionManager={
                              versionHandlers.handleOpenVersionManager
                            }
                            onStatusChange={mediaHandlers.handleStatusChange}
                            userPermissions={userPermissions}
                            onRenameMedia={handleRenameMedia}
                            reviewLinks={reviewLinks}
                            onReviewLinksUpdated={onReviewLinksUpdated}
                            allFolders={folders} // This should come from your parent component's state
                            onMediaUpdated={handleMediaUpdated} // This should be a function in your parent component
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="folders" className=" min-h-screen">
            <div
              className="flex-1 overflow-y-auto min-h-screen"
              ref={containerRef}
            >
              {isLoadingFolders ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                  <p>Loading folders...</p>
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center py-12">
                  <FolderIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg">No folders found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Create your first folder to organize files"}
                  </p>
                  {!searchQuery && userPermissions.canUpload && (
                    <Button
                      onClick={() => setCreateFolderOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Folder
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Folders</h3>
                  <div
                    className={getGridClasses(
                      filteredFolders.length,
                      containerWidth
                    )}
                  >
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        projectId={projectId}
                        viewMode={viewMode}
                        onFoldersUpdate={(updatedFolders) => {
                          setFolders(updatedFolders);
                          if (passedOnFoldersUpdate) {
                            passedOnFoldersUpdate(updatedFolders);
                          }
                        }}
                        allFolders={folders}
                      />
                    ))}
                  </div>{" "}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden file input */}
      {userPermissions.canUpload && (
        <input
          id="file-input"
          type="file"
          multiple
          accept="video/mp4,video/mov,image/svg+xml,video/avi,video/mkv,video/webm,image/jpg,image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac,audio/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading || !uploadStatus?.canUpload || isLoadingLimits}
        />
      )}

      {/* Project References Dialog */}
      <ProjectReferencesDialog
        open={referencesDialog.open}
        onOpenChange={(open) => setReferencesDialog({ open })}
        projectReferences={project.project_references || []}
        projectName={project.name}
        onReferencesUpdate={async (updatedReferences) => {
          const result = await updateProjectReferencesAction(
            projectId,
            updatedReferences
          );

          if (result.success) {
            toast({
              title: "References Updated",
              description: "Project references have been updated successfully",
              variant: "green",
            });
          } else {
            toast({
              title: "Update Failed",
              description:
                result.error || "Failed to update project references",
              variant: "destructive",
            });
          }
        }}
        readOnly={!userPermissions.canUpload}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        projectId={projectId}
        parentFolderId={currentFolderId}
        onFolderCreated={handleFolderCreated}
      />

      {/* Media Dialogs */}
      <MediaDialogs
        createLinkDialog={createLinkDialog}
        viewLinksDialog={viewLinksDialog}
        manageLinksDialog={manageLinksDialog}
        versionManagerDialog={versionManagerDialog}
        deleteDialog={deleteDialog}
        onCreateLinkDialogChange={setCreateLinkDialog}
        onViewLinksDialogChange={setViewLinksDialog}
        onManageLinksDialogChange={setManageLinksDialog}
        onVersionManagerDialogChange={setVersionManagerDialog}
        onDeleteDialogChange={setDeleteDialog}
        onCreateReviewLink={reviewLinkHandlers.handleCreateReviewLink}
        onToggleReviewLink={reviewLinkHandlers.handleToggleReviewLink}
        onUpdateReviewLink={reviewLinkHandlers.handleUpdateReviewLink}
        onDeleteReviewLink={reviewLinkHandlers.handleDeleteReviewLink}
        onVersionReorder={versionHandlers.handleVersionReorder}
        onUpdateVersionName={versionHandlers.handleUpdateVersionName}
        onDeleteVersion={versionHandlers.handleDeleteVersion}
        onDeleteMedia={mediaHandlers.handleDeleteMedia}
        projectId={projectId}
        onMediaUpdated={handleMediaUpdated}
        editNameDialog={editNameDialog}
        onEditNameDialogChange={setEditNameDialog}
        onRenameMedia={handleRenameMedia}
        reviewLinks={reviewLinks}
      />

      {/* Global drag message */}
      {draggedMedia && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          Drag to another media to create a version
        </div>
      )}
    </div>
  );
}