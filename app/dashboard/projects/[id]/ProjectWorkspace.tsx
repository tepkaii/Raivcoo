// app/dashboard/projects/[id]/ProjectWorkspace.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from "react";
import { MediaGrid } from "./components/Media/MediaGrid";
import { MediaViewer } from "./components/Media/MediaViewer";
import { ReviewComments } from "@/app/review/[token]/components/ReviewComments";
import { TeamManagement } from "./components/TeamManagement/TeamManagement";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  CommentsPanel,
  MediaCardsPanel,
  MediaPlayerPanel,
} from "@/app/components/icons";
import { MediaFile, ReviewLink, ProjectFolder } from "../../lib/types";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  ChatBubbleBottomCenterTextIcon,
  EyeIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { Badge } from "@/components/ui/badge";

// Import handlers
import {
  createPanelHandlers,
  createResizeHandlers,
  createMediaHandlers,
  createPermissionHandlers,
  createCommentHandlers,
  ProjectRole,
} from "./handlers/Workspace";
import { ProjectInfoDialog } from "./components/TeamManagement/ProjectInfoDialog";

// Add enhanced folder interface
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
  project_folders?: EnhancedProjectFolder[]; // Add enhanced folders
  user_role?: ProjectRole | null;
}

interface ProjectWorkspaceProps {
  project: Project;
  authenticatedUser?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  } | null;
  isOwner: boolean;
  currentFolderId?: string;
}

export function ProjectWorkspace({
  project,
  authenticatedUser,
  isOwner,
  currentFolderId,
}: ProjectWorkspaceProps) {
  // Basic state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>(
    project.review_links || []
  );
  const [members, setMembers] = useState<ProjectMember[]>(
    project.project_members || []
  );
  const [folders, setFolders] = useState<EnhancedProjectFolder[]>(
    project.project_folders || []
  ); // Add folders state
  const [showTeamDialog, setShowTeamDialog] = useState(false);
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

  // Update handlers when dependencies change
  const handleMediaUpdated = (newFiles: MediaFile[]) => {
    setMediaFiles(newFiles);
    mediaHandlers.handleMediaUpdated(newFiles);
  };

  const handleReviewLinksUpdated = (newLinks: ReviewLink[]) => {
    setReviewLinks(newLinks);
  };

  const handleMembersUpdate = (newMembers: ProjectMember[]) => {
    setMembers(newMembers);
  };

  const handleFoldersUpdate = (newFolders: EnhancedProjectFolder[]) => {
    setFolders(newFolders);
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
      {/* Header */}
      <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0">
        <div className="flex items-center h-full">
          <div className="flex items-center justify-center border-l border-r h-full mr-3">
            <div className="flex items-center mr-2 ml-2 h-full">
              <SidebarTrigger />
            </div>
          </div>
          <div className="border-r flex items-center h-full">
            <div className="mr-3 flex items-center gap-2">
              <span className="text-sm md:text-base">
                {project.name} - Project
              </span>
              <div className="flex items-center gap-1">
                {!isOwner && project.user_role && (
                  <>
                    {/* Only show Project Info Dialog for members (non-owners) */}
                    <ProjectInfoDialog
                      projectId={project.id}
                      projectName={project.name}
                      userRole={project.user_role}
                      isOwner={isOwner}
                      currentUserId={authenticatedUser?.id || ""}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {permissions.canManageMembers && (
            <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
              <DialogTrigger asChild>
                <div className="border-r flex items-center border-border h-full">
                  <Button
                    variant="ghost"
                    className="border-none bg-none ml-1 mr-1"
                    size="icon"
                    title="Manage Team Members"
                  >
                    <UsersIcon className="size-5" />
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent
                className="max-w-2xl max-h-[80vh] overflow-y-auto"
                showCloseButton={false}
              >
                <TeamManagement
                  projectId={project.id}
                  members={members}
                  isOwner={isOwner}
                  onMembersUpdate={handleMembersUpdate}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Panel Toggle Buttons - Desktop only */}
        {!isMobile && (
          <div className="flex items-center gap-1">
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

      {/* Main Content Area */}
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
                currentFolderId={currentFolderId} // Use the prop instead of undefined variable
                folders={folders} // Pass the enhanced folders with media data
                onFoldersUpdate={handleFoldersUpdate} // Pass the folder update handler
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
    </div>
  );
}
