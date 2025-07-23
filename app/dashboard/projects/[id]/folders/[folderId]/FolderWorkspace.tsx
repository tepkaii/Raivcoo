// app/dashboard/projects/[id]/folders/[folderId]/FolderWorkspace.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { ProjectFolder, MediaFile, ReviewLink } from "../../../../types";
import { CreateFolderDialog } from "../components/CreateFolderDialog";
import { FolderUpload } from "../components/FolderUpload";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Import workspace components and handlers
import { MediaGrid } from "../../components/Media/MediaGrid";
import { MediaViewer } from "../../components/Media/MediaViewer";
import { ReviewComments } from "@/app/review/[token]/components/Review/ReviewComments";

import {
  CommentsPanel,
  MediaCardsPanel,
  MediaPlayerPanel,
} from "@/app/components/icons";
import {
  ChatBubbleBottomCenterTextIcon,
  ChevronDownIcon,
  EyeIcon,
  FolderIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";

// Import handlers from workspace
import {
  createPanelHandlers,
  createResizeHandlers,
  createMediaHandlers,
  createPermissionHandlers,
  createCommentHandlers,
  ProjectRole,
} from "../../handlers/Workspace";
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
export interface EnhancedProjectFolder extends ProjectFolder {
  media_files?: MediaFile[];
  stats?: FolderStats;
}
interface ProjectMember {
  id: string;
  user_id: string;
  role: ProjectRole;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  joined_at?: string;
  user_profile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_references?: any[];
  project_media: MediaFile[];
  review_links: ReviewLink[];
  project_members?: ProjectMember[];
  project_folders?: ProjectFolder[];
  user_role?: ProjectRole | null;
}

interface FolderWorkspaceProps {
  project: Project;
  currentFolder: ProjectFolder;
  allFolders: EnhancedProjectFolder[]; // Now supports enhanced folders
  authenticatedUser?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  } | null;
  isOwner: boolean;
}

export function FolderWorkspace({
  project,
  currentFolder,
  allFolders,
  authenticatedUser,
  isOwner,
}: FolderWorkspaceProps) {
  // Basic state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>(
    project.review_links || []
  );

  const [isRangeSelectionMode, setIsRangeSelectionMode] = useState(false);

  // ✅ ADD: Local range selection state for proper synchronization
  const [pendingRangeSelection, setPendingRangeSelection] = useState<{
    startTime: number;
    endTime: number;
  } | null>(null);

  const [folders, setFolders] = useState<ProjectFolder[]>(allFolders);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderUploadOpen, setFolderUploadOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaViewerRef = useRef<any>(null);

  // Create handlers
  const permissions = createPermissionHandlers(project.user_role, isOwner);
  const panelHandlers = createPanelHandlers(isMobile);
  const mediaHandlers = createMediaHandlers(
    mediaFiles,
    isMobile,
    panelHandlers.setShowMediaPlayer
  );
  const resizeHandlers = createResizeHandlers(
    isMobile,
    panelHandlers.libraryWidth,
    panelHandlers.playerWidth,
    panelHandlers.commentsWidth,
    panelHandlers.setLibraryWidth,
    panelHandlers.setPlayerWidth,
    panelHandlers.setCommentsWidth,
    panelHandlers.showMediaLibrary,
    panelHandlers.showCommentsPanel,
    containerRef
  );
  const commentHandlers = createCommentHandlers(project.id);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Breadcrumb navigation
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentFolderNav = currentFolder;

    while (currentFolderNav) {
      breadcrumbs.unshift(currentFolderNav);
      if (currentFolderNav.parent_folder_id) {
        currentFolderNav =
          folders.find((f) => f.id === currentFolderNav.parent_folder_id) ||
          null;
      } else {
        break;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleRangeCancelled = () => {
    setPendingRangeSelection(null);
    setIsRangeSelectionMode(false);
    // Also unlock the timeline
    if (mediaViewerRef.current?.unlockTimelineRange) {
      mediaViewerRef.current.unlockTimelineRange();
    }
  };

  const handleRangeSelect = (startTime: number, endTime: number) => {
    setPendingRangeSelection({ startTime, endTime });
    setIsRangeSelectionMode(false);
  };

  const handleRangeSelectionComplete = () => {
    setPendingRangeSelection(null);
    setIsRangeSelectionMode(false);
  };

  const handleRangeCommentRequest = () => {
    setIsRangeSelectionMode(true);
    if (mediaViewerRef.current?.handleRangeCommentRequest) {
      mediaViewerRef.current.handleRangeCommentRequest();
    }
  };

  const handleTimelineRangeUnlock = () => {
    setPendingRangeSelection(null);
    setIsRangeSelectionMode(false);
    if (mediaViewerRef.current?.unlockTimelineRange) {
      mediaViewerRef.current.unlockTimelineRange();
    }
  };

  // Update handlers when dependencies change
  const handleMediaUpdated = (newFiles: MediaFile[]) => {
    setMediaFiles(newFiles);
    mediaHandlers.handleMediaUpdated(newFiles);
  };

  const handleReviewLinksUpdated = (newLinks: ReviewLink[]) => {
    setReviewLinks(newLinks);
  };

  const handleFolderUploadComplete = (newFiles: any[], newFolders: any[]) => {
    setFolders([...folders, ...newFolders]);
    setMediaFiles((prev) => [...prev, ...newFiles]);
    setFolderUploadOpen(false);
    toast({
      title: "Upload Complete",
      description: `Uploaded ${newFiles.length} files in ${newFolders.length} folders`,
      variant: "green",
    });
  };

  const handleAnnotationCreate = (annotation: any) => {
    if (
      !panelHandlers.showCommentsPanel &&
      !isMobile &&
      permissions.canComment
    ) {
      panelHandlers.setShowCommentsPanel(true);
    }
  };

  const handleCommentsToggle = () => {
    panelHandlers.handleCommentsToggle(permissions.canComment);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with Breadcrumbs */}
      <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0">
        <div className="flex items-center h-full flex-1 min-w-0">
          <div className="flex items-center justify-center border-l border-r h-full mr-3">
            <div className="flex items-center mr-2 ml-2 h-full">
              <SidebarTrigger />
            </div>
          </div>

          <div className=" flex items-center h-full flex-1 min-w-0">
            <div className="mr-3 flex items-center gap-2 flex-1 min-w-0">
              {/* Mobile Breadcrumb */}
              <div className="flex items-center gap-2 flex-1 min-w-0 sm:hidden">
                {breadcrumbs.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 max-w-[180px]"
                      >
                        <FolderIcon
                          className="h-4 w-4 flex-shrink-0"
                          style={{
                            color: breadcrumbs[breadcrumbs.length - 1].color,
                          }}
                        />
                        <span className="text-sm truncate">
                          {breadcrumbs[breadcrumbs.length - 1].name}
                        </span>
                        <ChevronDownIcon className="h-3 w-3 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[250px]">
                      {/* Root level */}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="flex items-center"
                        >
                          <HomeIcon className="h-4 w-4 mr-2" />
                          <span>{project.name}</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Folders level */}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/projects/${project.id}/folders`}
                          className="flex items-center"
                        >
                          <div className="w-4 mr-2" />{" "}
                          {/* Indentation spacer */}
                          <FolderIcon className="h-4 w-4 mr-2" />
                          <span>Folders</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Hierarchical folder breadcrumbs */}
                      {breadcrumbs.map((breadcrumb, index) => (
                        <DropdownMenuItem key={breadcrumb.id} asChild>
                          <Link
                            href={`/dashboard/projects/${project.id}/folders/${breadcrumb.id}`}
                            className="flex items-center"
                          >
                            {/* Indentation based on level */}
                            <div
                              className="flex items-center"
                              style={{ paddingLeft: `${(index + 2) * 12}px` }}
                            >
                              <FolderIcon
                                className="h-4 w-4 mr-2"
                                style={{ color: breadcrumb.color }}
                              />
                              <span
                                className={
                                  index === breadcrumbs.length - 1
                                    ? "font-semibold"
                                    : ""
                                }
                              >
                                {breadcrumb.name}
                              </span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link href={`/dashboard/projects/${project.id}/folders`}>
                      <FolderIcon className="h-4 w-4" />
                      <span className="text-sm">Folders</span>
                    </Link>
                  </Button>
                )}
              </div>

              {/* Desktop Breadcrumb - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span className="text-sm">{project.name}</span>
                  </Button>
                </Link>

                <span className="text-muted-foreground">/</span>

                <Link href={`/dashboard/projects/${project.id}/folders`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FolderIcon className="h-4 w-4" />
                    <span className="text-sm">Folders</span>
                  </Button>
                </Link>

                {/* Show breadcrumbs with ellipsis if too many */}
                {breadcrumbs.length > 2 ? (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {breadcrumbs.slice(0, -2).map((breadcrumb) => (
                          <DropdownMenuItem key={breadcrumb.id} asChild>
                            <Link
                              href={`/dashboard/projects/${project.id}/folders/${breadcrumb.id}`}
                            >
                              <FolderIcon
                                className="h-4 w-4 mr-2"
                                style={{ color: breadcrumb.color }}
                              />
                              {breadcrumb.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {breadcrumbs.slice(-2).map((breadcrumb, index) => (
                      <React.Fragment key={breadcrumb.id}>
                        <span className="text-muted-foreground">/</span>
                        <Link
                          href={`/dashboard/projects/${project.id}/folders/${breadcrumb.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-2 ${
                              index === 1 ? "font-semibold" : ""
                            }`}
                          >
                            <FolderIcon
                              className="h-4 w-4"
                              style={{ color: breadcrumb.color }}
                            />
                            <span className="text-sm truncate max-w-[100px]">
                              {breadcrumb.name}
                            </span>
                          </Button>
                        </Link>
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.id}>
                      <span className="text-muted-foreground">/</span>
                      <Link
                        href={`/dashboard/projects/${project.id}/folders/${breadcrumb.id}`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-2 ${
                            index === breadcrumbs.length - 1
                              ? "font-semibold"
                              : ""
                          }`}
                        >
                          <FolderIcon
                            className="h-4 w-4"
                            style={{ color: breadcrumb.color }}
                          />
                          <span className="text-sm truncate max-w-[100px]">
                            {breadcrumb.name}
                          </span>
                        </Button>
                      </Link>
                    </React.Fragment>
                  ))
                )}
              </div>

              {!isOwner && project.user_role && (
                <Badge
                  variant="outline"
                  className="text-sm hidden sm:inline-flex"
                >
                  {project.user_role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Panel Toggle Buttons - Desktop only */}
        {!isMobile && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={panelHandlers.handleMediaLibraryToggle}
              variant="ghost"
              className="border-none bg-none"
              size="icon"
              disabled={
                panelHandlers.showMediaLibrary &&
                !panelHandlers.canToggleMediaLibrary
              }
            >
              <MediaCardsPanel
                className={`size-5 ${
                  panelHandlers.showMediaLibrary &&
                  !panelHandlers.canToggleMediaLibrary
                    ? "opacity-50"
                    : panelHandlers.showMediaLibrary
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>

            <Button
              onClick={panelHandlers.handleMediaPlayerToggle}
              variant="ghost"
              className="border-none bg-none"
              size="icon"
              disabled={
                panelHandlers.playerLocked ||
                (!panelHandlers.showMediaPlayer &&
                  !panelHandlers.showMediaLibrary) ||
                (panelHandlers.showMediaPlayer &&
                  panelHandlers.openPanelsCount === 1)
              }
            >
              <MediaPlayerPanel
                className={`size-5 ${
                  panelHandlers.playerLocked ||
                  (!panelHandlers.showMediaPlayer &&
                    !panelHandlers.showMediaLibrary) ||
                  (panelHandlers.showMediaPlayer &&
                    panelHandlers.openPanelsCount === 1)
                    ? "opacity-50"
                    : panelHandlers.showMediaPlayer
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>

            <Button
              onClick={handleCommentsToggle}
              variant="ghost"
              className="border-none bg-none mr-2"
              size="icon"
              disabled={
                !permissions.canComment ||
                panelHandlers.commentsLocked ||
                (!panelHandlers.showCommentsPanel &&
                  !panelHandlers.showMediaLibrary) ||
                (panelHandlers.showCommentsPanel &&
                  panelHandlers.openPanelsCount === 1)
              }
            >
              <CommentsPanel
                className={`size-5 ${
                  !permissions.canComment ||
                  panelHandlers.commentsLocked ||
                  (!panelHandlers.showCommentsPanel &&
                    !panelHandlers.showMediaLibrary) ||
                  (panelHandlers.showCommentsPanel &&
                    panelHandlers.openPanelsCount === 1)
                    ? "opacity-50"
                    : panelHandlers.showCommentsPanel
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>
          </div>
        )}
      </header>

      {/* Main Workspace Content - Using the same structure as ProjectWorkspace */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Media Library Panel */}
        {(panelHandlers.showMediaLibrary || isMobile) && (
          <div
            className="border-r flex flex-col flex-shrink-0 min-w-0"
            style={{
              width: isMobile ? "100%" : `${panelHandlers.widths.library}%`,
            }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MediaGrid
                mediaFiles={mediaFiles}
                reviewLinks={reviewLinks}
                selectedMedia={!isMobile ? mediaHandlers.selectedMedia : null}
                onMediaSelect={mediaHandlers.handleMediaSelect}
                onMediaUpdated={handleMediaUpdated}
                onReviewLinksUpdated={handleReviewLinksUpdated}
                projectId={project.id}
                project={project}
                userPermissions={{
                  canUpload: permissions.canUpload,
                  canDelete: permissions.canDelete,
                  canEditStatus: permissions.canEditStatus,
                  canCreateReviewLinks: permissions.canCreateReviewLinks,
                }}
                currentFolderId={currentFolder.id}
                folders={folders} // Pass the enhanced folders with media data
                onFoldersUpdate={setFolders} // Pass the folder update handler
              />
            </div>
          </div>
        )}

        {/* Resize Handle between Library and Player */}
        {!isMobile &&
          panelHandlers.showMediaLibrary &&
          panelHandlers.showMediaPlayer && (
            <div
              className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
              onMouseDown={(e) =>
                resizeHandlers.handleResizeStart("library-player", e)
              }
            >
              <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

        {/* Resize Handle between Library and Comments */}
        {!isMobile &&
          panelHandlers.showMediaLibrary &&
          panelHandlers.showCommentsPanel &&
          !panelHandlers.showMediaPlayer && (
            <div
              className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
              onMouseDown={(e) =>
                resizeHandlers.handleResizeStart("library-comments", e)
              }
            >
              <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

        {/* Media Player Panel */}
        {!isMobile && panelHandlers.showMediaPlayer && (
          <div
            className="bg-black flex flex-col min-w-0 flex-shrink-0"
            style={{ width: `${panelHandlers.widths.player}%` }}
          >
            {mediaHandlers.selectedMedia ? (
              <MediaViewer
                ref={mediaViewerRef}
                media={mediaHandlers.selectedMedia}
                allVersions={mediaHandlers.getAllVersionsForMedia(
                  mediaHandlers.selectedMedia
                )}
                onMediaChange={mediaHandlers.setSelectedMedia}
                onTimeUpdate={mediaHandlers.setCurrentTime}
                currentTime={mediaHandlers.currentTime}
                showHeaderControls={false}
                onCommentsUpdate={mediaHandlers.handleCommentsUpdate}
                onAnnotationCreate={handleAnnotationCreate}
                authenticatedUser={authenticatedUser}
                allowDownload={true}
                userPermissions={{
                  canComment: permissions.canComment,
                  canEditStatus: permissions.canEditStatus,
                }}
                onCommentPinClick={(comment) => {
                  if (mediaViewerRef.current) {
                    mediaViewerRef.current.handleCommentPinClick(comment);
                  }
                }}
                onCommentDrawingClick={(comment) => {
                  if (mediaViewerRef.current) {
                    mediaViewerRef.current.handleCommentDrawingClick(comment);
                  }
                }}
                // ✅ ADD: Range selection props
                onRangeSelect={handleRangeSelect}
                isRangeSelectionMode={isRangeSelectionMode}
                onRangeSelectionModeChange={setIsRangeSelectionMode}
                pendingRangeSelection={pendingRangeSelection}
                onRangeSelectionComplete={handleRangeSelectionComplete}
              />
            ) : (
              <div className="flex-1 min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <EyeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select Media</h3>
                  <p className="text-sm">Choose a video or image to view</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resize Handle between Player and Comments */}
        {!isMobile &&
          panelHandlers.showMediaPlayer &&
          panelHandlers.showCommentsPanel && (
            <div
              className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
              onMouseDown={(e) =>
                resizeHandlers.handleResizeStart("player-comments", e)
              }
            >
              <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

        {/* Comments Panel */}
        {!isMobile &&
          panelHandlers.showCommentsPanel &&
          permissions.canComment && (
            <div
              className="border-l rounded-md p-4 flex flex-col flex-shrink-0 min-w-0"
              style={{ width: `${panelHandlers.widths.comments}%` }}
            >
              <div className="flex-1 min-h-0 overflow-hidden bg-primary-foreground/35 border rounded-2xl">
                {mediaHandlers.selectedMedia ? (
                  <ReviewComments
                    mediaId={mediaHandlers.selectedMedia.id}
                    mediaType={mediaHandlers.selectedMedia.file_type}
                    media={mediaHandlers.selectedMedia}
                    currentTime={mediaHandlers.currentTime}
                    onSeekToTimestamp={(timestamp) => {
                      mediaViewerRef.current?.handleSeekToTimestamp?.(
                        timestamp
                      );
                    }}
                    className="h-full"
                    onCommentPinClick={(comment) => {
                      mediaViewerRef.current?.handleCommentPinClick?.(comment);
                    }}
                    onCommentDrawingClick={(comment) => {
                      mediaViewerRef.current?.handleCommentDrawingClick?.(
                        comment
                      );
                    }}
                    onCommentDeleted={(deletedCommentId) => {
                      const newComments = mediaHandlers.comments.filter(
                        (c) => c.id !== deletedCommentId
                      );
                      mediaHandlers.setComments(newComments);
                      if (mediaViewerRef.current?.loadComments) {
                        mediaViewerRef.current.loadComments();
                      }
                    }}
                    onCommentAdded={(newComment) => {
                      mediaHandlers.setComments([
                        ...mediaHandlers.comments,
                        newComment,
                      ]);
                      if (mediaViewerRef.current?.loadComments) {
                        mediaViewerRef.current.loadComments();
                      }
                    }}
                    onAnnotationRequest={(type, config) => {
                      if (mediaViewerRef.current) {
                        mediaViewerRef.current.handleAnnotationRequest(
                          type,
                          config
                        );
                      }
                    }}
                    onClearActiveComments={() => {
                      if (mediaViewerRef.current) {
                        mediaViewerRef.current.clearActiveComments();
                      }
                    }}
                    authenticatedUser={authenticatedUser}
                    userPermissions={{
                      canComment: permissions.canComment,
                      canEditStatus: permissions.canEditStatus,
                    }}
                    projectMode={true}
                    projectId={project.id}
                    createCommentOverride={commentHandlers.handleCreateComment}
                    // ✅ ADD: Range selection props
                    onRangeCommentRequest={handleRangeCommentRequest}
                    pendingRangeSelection={pendingRangeSelection}
                    onRangeSelectionComplete={handleRangeSelectionComplete}
                    onTimelineRangeUnlock={handleTimelineRangeUnlock}
                  />
                ) : (
                  <div className="flex-1 min-h-screen flex items-center justify-center p-8">
                    <div className="text-center">
                      <ChatBubbleBottomCenterTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Select Media</h3>
                      <p className="text-sm">Choose media to view comments</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        projectId={project.id}
        parentFolderId={currentFolder.id}
        onFolderCreated={(newFolder) => {
          setFolders([...folders, newFolder]);
          setCreateFolderOpen(false);
        }}
      />

      <FolderUpload
        open={folderUploadOpen}
        onOpenChange={setFolderUploadOpen}
        projectId={project.id}
        onUploadComplete={handleFolderUploadComplete}
      />
    </div>
  );
}
