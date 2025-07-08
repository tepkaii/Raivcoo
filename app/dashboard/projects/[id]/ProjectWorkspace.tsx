// app/dashboard/projects/[id]/ProjectWorkspace.tsx
// @ts-nocheck
"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { MediaGrid } from "./components/Media/MediaGrid";
import { MediaViewer } from "./components/Media/MediaViewer";
import { ReviewComments } from "@/app/review/[token]/review_components/ReviewComments";
import { TeamManagement } from "./components/TeamManagement/TeamManagement";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CommentsPanel,
  MediaCardsPanel,
  MediaPlayerPanel,
} from "@/app/components/icons";
import { MediaFile, ReviewLink } from "../../lib/types";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  ChatBubbleBottomCenterTextIcon,
  EyeIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { createCommentAction } from "./lib/CommentActions";

// Define types
// 
type ProjectRole = "viewer" | "reviewer" | "collaborator";

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
}

// Permission system
const ROLE_PERMISSIONS = {
  viewer: {
    canView: true,
    canComment: false,
    canUpload: false,
    canDelete: false,
    canEditStatus: false,
    canCreateReviewLinks: false,
    canManageMembers: false,
  },
  reviewer: {
    canView: true,
    canComment: true,
    canUpload: false,
    canDelete: false,
    canEditStatus: true,
    canCreateReviewLinks: false,
    canManageMembers: false,
  },
  collaborator: {
    canView: true,
    canComment: true,
    canUpload: true,
    canDelete: true,
    canEditStatus: true,
    canCreateReviewLinks: true,
    canManageMembers: false,
  },
} as const;

function hasPermission(
  role: ProjectRole | null,
  permission: keyof typeof ROLE_PERMISSIONS.viewer
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

export function ProjectWorkspace({
  project,
  authenticatedUser,
  isOwner,
}: ProjectWorkspaceProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>(
    project.review_links || []
  );
  const [members, setMembers] = useState<ProjectMember[]>(
    project.project_members || []
  );
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [showTeamDialog, setShowTeamDialog] = useState(false);

  // Track screen size
  const [isMobile, setIsMobile] = useState(false);

  // Panel visibility states - BACK TO ORIGINAL 3-PANEL SYSTEM
  const [showMediaLibrary, setShowMediaLibrary] = useState(true);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  // Panel widths as percentages - BACK TO ORIGINAL
  const [libraryWidth, setLibraryWidth] = useState(30);
  const [playerWidth, setPlayerWidth] = useState(45);
  const [commentsWidth, setCommentsWidth] = useState(25);

  const [isResizing, setIsResizing] = useState<
    "library-player" | "player-comments" | "library-comments" | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaViewerRef = useRef<any>(null);

  // Get user's permissions
  const userRole = project.user_role;
  const canUpload = isOwner || hasPermission(userRole, "canUpload");
  const canDelete = isOwner || hasPermission(userRole, "canDelete");
  const canComment = isOwner || hasPermission(userRole, "canComment");
  const canEditStatus = isOwner || hasPermission(userRole, "canEditStatus");
  const canCreateReviewLinks =
    isOwner || hasPermission(userRole, "canCreateReviewLinks");
  const canManageMembers = isOwner;

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768; // md breakpoint
      setIsMobile(isMobileSize);

      if (isMobileSize) {
        // Force mobile layout - only show media library
        setShowMediaLibrary(true);
        setShowMediaPlayer(false);
        setShowCommentsPanel(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleCreateComment = async (data: any) => {
    const result = await createCommentAction({
      projectId: project.id,
      mediaId: data.mediaId,
      content: data.content,
      timestampSeconds: data.timestampSeconds,
      parentCommentId: data.parentCommentId,
      annotationData: data.annotationData,
      drawingData: data.drawingData,
      // ✅ DO NOT PASS reviewToken for project path
      // reviewToken: undefined, // Remove this line entirely
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  };
  // Get all versions for selected media
  const getAllVersionsForMedia = (mediaFile: MediaFile | null) => {
    if (!mediaFile) return [];
    const parentId = mediaFile.parent_media_id || mediaFile.id;
    const parent = mediaFiles.find((f) => f.id === parentId);
    const versions = mediaFiles.filter((f) => f.parent_media_id === parentId);
    const allVersions = parent ? [parent, ...versions] : versions;
    return allVersions.sort((a, b) => b.version_number - a.version_number);
  };

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media);
    setCurrentTime(0);
  };

  const handleMediaUpdated = (newFiles: MediaFile[]) => {
    setMediaFiles(newFiles);
    if (selectedMedia) {
      const updatedSelected = newFiles.find((f) => f.id === selectedMedia.id);
      if (updatedSelected) {
        setSelectedMedia(updatedSelected);
      } else {
        setSelectedMedia(null);
      }
    }
  };

  const handleReviewLinksUpdated = (newLinks: ReviewLink[]) => {
    setReviewLinks(newLinks);
  };

  const handleMembersUpdate = (newMembers: ProjectMember[]) => {
    setMembers(newMembers);
    // No more window.location.reload()!
  };
  // Handle comments update from MediaViewer
  const handleCommentsUpdate = (newComments: any[]) => {
    setComments(newComments);
  };

  // Handle annotation creation from MediaViewer
  const handleAnnotationCreate = (annotation: any) => {
    if (!showCommentsPanel && !isMobile && canComment) {
      setShowCommentsPanel(true);
    }
  };

  // BACK TO ORIGINAL PANEL LOGIC - Count open panels (only for desktop)
  const openPanelsCount = !isMobile
    ? [showMediaLibrary, showMediaPlayer, showCommentsPanel].filter(Boolean)
        .length
    : 1;

  // BACK TO ORIGINAL PANEL TOGGLE LOGIC
  const canToggleMediaLibrary = (() => {
    if (isMobile) return false; // Disable on mobile
    if (!showMediaLibrary) return true;
    if (openPanelsCount === 1) return false;
    if (openPanelsCount === 2) return false;
    if (openPanelsCount === 3) return true;
    return false;
  })();

  const playerLocked = !showMediaLibrary && showMediaPlayer;
  const commentsLocked = !showMediaLibrary && showCommentsPanel;

  const handleMediaLibraryToggle = () => {
    if (isMobile) return; // Disable on mobile

    if (!showMediaLibrary) {
      setShowMediaLibrary(true);
    } else if (canToggleMediaLibrary) {
      setShowMediaLibrary(false);
    }
  };

  const handleMediaPlayerToggle = () => {
    if (isMobile || playerLocked) return; // Disable on mobile

    if (!showMediaPlayer) {
      if (showMediaLibrary) {
        setShowMediaPlayer(true);
      }
    } else {
      if (openPanelsCount > 1) {
        setShowMediaPlayer(false);
      }
    }
  };

  const handleCommentsToggle = () => {
    if (isMobile || commentsLocked || !canComment) return; // Disable on mobile and for users without comment permission

    if (!showCommentsPanel) {
      if (showMediaLibrary) {
        setShowCommentsPanel(true);
      }
    } else {
      if (openPanelsCount > 1) {
        setShowCommentsPanel(false);
      }
    }
  };

  // BACK TO ORIGINAL WIDTH CALCULATION
  const widths = useMemo(() => {
    // On mobile, always full width for media library
    if (isMobile) {
      return { library: 100, player: 0, comments: 0 };
    }

    if (openPanelsCount === 1) {
      if (showMediaLibrary) return { library: 100, player: 0, comments: 0 };
      if (showMediaPlayer) return { library: 0, player: 100, comments: 0 };
      if (showCommentsPanel) return { library: 0, player: 0, comments: 100 };
    } else if (openPanelsCount === 2) {
      if (showMediaLibrary && showMediaPlayer) {
        return {
          library: libraryWidth,
          player: 100 - libraryWidth,
          comments: 0,
        };
      } else if (showMediaLibrary && showCommentsPanel) {
        return {
          library: libraryWidth,
          player: 0,
          comments: 100 - libraryWidth,
        };
      } else if (showMediaPlayer && showCommentsPanel) {
        return { library: 0, player: playerWidth, comments: 100 - playerWidth };
      }
    } else if (openPanelsCount === 3) {
      return {
        library: libraryWidth,
        player: playerWidth,
        comments: commentsWidth,
      };
    }

    return { library: showMediaLibrary ? 100 : 0, player: 0, comments: 0 };
  }, [
    isMobile,
    openPanelsCount,
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
    libraryWidth,
    playerWidth,
    commentsWidth,
  ]);

  // BACK TO ORIGINAL RESIZING HANDLERS
  const handleResizeStart = useCallback(
    (
      type: "library-player" | "player-comments" | "library-comments",
      e: React.MouseEvent
    ) => {
      if (isMobile) return; // Disable on mobile

      setIsResizing(type);
      e.preventDefault();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isMobile]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current || isMobile) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const mousePercent = (mouseX / containerWidth) * 100;

      if (isResizing === "library-player") {
        const newLibraryWidth = Math.max(20, Math.min(60, mousePercent));
        setLibraryWidth(newLibraryWidth);
        if (showCommentsPanel) {
          const remaining = 100 - newLibraryWidth;
          setPlayerWidth(remaining * 0.7);
          setCommentsWidth(remaining * 0.3);
        }
      } else if (isResizing === "player-comments") {
        const libraryTaken = showMediaLibrary ? libraryWidth : 0;
        const availableSpace = 100 - libraryTaken;
        const relativeMousePercent =
          (((mouseX / containerWidth) * 100 - libraryTaken) / availableSpace) *
          100;
        const newPlayerPercent = Math.max(
          30,
          Math.min(70, relativeMousePercent)
        );
        setPlayerWidth((availableSpace * newPlayerPercent) / 100);
        setCommentsWidth((availableSpace * (100 - newPlayerPercent)) / 100);
      } else if (isResizing === "library-comments") {
        const newLibraryWidth = Math.max(20, Math.min(80, mousePercent));
        setLibraryWidth(newLibraryWidth);
      }
    },
    [isResizing, libraryWidth, showMediaLibrary, showCommentsPanel, isMobile]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    if (isResizing && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, isMobile]);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get("media");

    if (mediaId) {
      const media = mediaFiles.find((m) => m.id === mediaId);
      if (media) {
        setSelectedMedia(media);
        // Show media player if not visible
        if (!showMediaPlayer && !isMobile) {
          setShowMediaPlayer(true);
        }
      }
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [mediaFiles, showMediaPlayer, isMobile]);
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0 ">
        <div className="flex items-center h-full">
          <div className="flex items-center justify-center border-l border-r h-full mr-3">
            <div className="flex items-center mr-2 ml-2 h-full">
              <SidebarTrigger />
            </div>
          </div>
          <div className="border-r flex items-center h-full">
            <div className="mr-3">
              <span className="text-sm md:text-base">
                {project.name} - Project
              </span>
              {!isOwner && userRole && (
                <span className="ml-2 text-xs bg-muted px-2 py-1 rounded capitalize">
                  {userRole}
                </span>
              )}
            </div>
          </div>
          {/* Team Management Dialog Button - Only for owners */}
          {canManageMembers && (
            <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
              <DialogTrigger asChild>
                <div className="border-r flex items-center border-border h-full">
                  <Button
                    variant="ghost"
                    className="border-none bg-none ml-1 mr-1 "
                    size="sm"
                    title="Manage Team Members "
                  >
                    <UsersIcon className="size-5 " />
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Team Management</DialogTitle>
                </DialogHeader>
                <TeamManagement
                  projectId={project.id}
                  members={members}
                  isOwner={isOwner}
                  onMembersUpdate={handleMembersUpdate} // Pass the smooth update function
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Panel Toggle Buttons + Team Dialog Button - Only show on desktop (md and up) */}
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button
              onClick={handleMediaLibraryToggle}
              variant="ghost"
              className="border-none bg-none"
              size="sm"
              disabled={showMediaLibrary && !canToggleMediaLibrary}
              title={
                showMediaLibrary && !canToggleMediaLibrary
                  ? openPanelsCount === 1
                    ? "Cannot hide Media Library when it's the only panel open"
                    : openPanelsCount === 2
                      ? "Cannot hide Media Library - other panels cannot be alone"
                      : undefined
                  : undefined
              }
            >
              <MediaCardsPanel
                className={`size-5 ${
                  showMediaLibrary && !canToggleMediaLibrary
                    ? "opacity-50"
                    : showMediaLibrary
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>

            <Button
              onClick={handleMediaPlayerToggle}
              variant="ghost"
              className="border-none bg-none"
              size="sm"
              disabled={
                playerLocked ||
                (!showMediaPlayer && !showMediaLibrary) ||
                (showMediaPlayer && openPanelsCount === 1)
              }
              title={
                playerLocked
                  ? "Enable Media Library to toggle Media Player"
                  : !showMediaPlayer && !showMediaLibrary
                    ? "Enable Media Library first to use Media Player"
                    : showMediaPlayer && openPanelsCount === 1
                      ? "Cannot hide the only remaining panel"
                      : undefined
              }
            >
              <MediaPlayerPanel
                className={`size-5 ${
                  playerLocked ||
                  (!showMediaPlayer && !showMediaLibrary) ||
                  (showMediaPlayer && openPanelsCount === 1)
                    ? "opacity-50"
                    : showMediaPlayer
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>

            <Button
              onClick={handleCommentsToggle}
              variant="ghost"
              className="border-none bg-none mr-2"
              size="sm"
              disabled={
                !canComment ||
                commentsLocked ||
                (!showCommentsPanel && !showMediaLibrary) ||
                (showCommentsPanel && openPanelsCount === 1)
              }
              title={
                !canComment
                  ? "You don't have permission to view comments"
                  : commentsLocked
                    ? "Enable Media Library to toggle Comments"
                    : !showCommentsPanel && !showMediaLibrary
                      ? "Enable Media Library first to use Comments"
                      : showCommentsPanel && openPanelsCount === 1
                        ? "Cannot hide the only remaining panel"
                        : undefined
              }
            >
              <CommentsPanel
                className={`size-5 ${
                  !canComment ||
                  commentsLocked ||
                  (!showCommentsPanel && !showMediaLibrary) ||
                  (showCommentsPanel && openPanelsCount === 1)
                    ? "opacity-50"
                    : showCommentsPanel
                      ? "text-blue-500"
                      : ""
                }`}
              />
            </Button>
          </div>
        )}
      </header>

      {/* Main Content Area - BACK TO ORIGINAL 3-PANEL SYSTEM */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Media Library Panel */}
        {(showMediaLibrary || isMobile) && (
          <div
            className="border-r flex flex-col flex-shrink-0 min-w-0"
            style={{ width: isMobile ? "100%" : `${widths.library}%` }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="w-full h-full">
                <MediaGrid
                  mediaFiles={mediaFiles}
                  reviewLinks={reviewLinks}
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleMediaSelect}
                  onMediaUpdated={handleMediaUpdated}
                  onReviewLinksUpdated={handleReviewLinksUpdated}
                  projectId={project.id}
                  project={project}
                  userPermissions={{
                    canUpload,
                    canDelete,
                    canEditStatus,
                    canCreateReviewLinks,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resize Handle between Library and Player - Desktop only */}
        {!isMobile && showMediaLibrary && showMediaPlayer && (
          <div
            className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
            onMouseDown={(e) => handleResizeStart("library-player", e)}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Resize Handle between Library and Comments - Desktop only */}
        {!isMobile &&
          showMediaLibrary &&
          showCommentsPanel &&
          !showMediaPlayer && (
            <div
              className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
              onMouseDown={(e) => handleResizeStart("library-comments", e)}
            >
              <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

        {/* Media Player Panel - Desktop only */}
        {!isMobile && showMediaPlayer && (
          <div
            className="bg-black flex flex-col min-w-0 flex-shrink-0"
            style={{ width: `${widths.player}%` }}
          >
            {selectedMedia ? (
              <MediaViewer
                ref={mediaViewerRef}
                media={selectedMedia}
                allVersions={getAllVersionsForMedia(selectedMedia)}
                onMediaChange={setSelectedMedia}
                onTimeUpdate={setCurrentTime}
                currentTime={currentTime}
                showHeaderControls={false}
                onCommentsUpdate={handleCommentsUpdate}
                onAnnotationCreate={handleAnnotationCreate}
                authenticatedUser={authenticatedUser}
                allowDownload={true}
                userPermissions={{
                  canComment,
                  canEditStatus,
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

        {/* Resize Handle between Player and Comments - Desktop only */}
        {!isMobile && showMediaPlayer && showCommentsPanel && (
          <div
            className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
            onMouseDown={(e) => handleResizeStart("player-comments", e)}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Comments Panel - Desktop only */}
        {!isMobile && showCommentsPanel && canComment && (
          <div
            className="border-l flex flex-col flex-shrink-0 min-w-0"
            style={{ width: `${widths.comments}%` }}
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              {selectedMedia ? (
                <ReviewComments
                  mediaId={selectedMedia.id}
                  mediaType={selectedMedia.file_type}
                  currentTime={currentTime}
                  onSeekToTimestamp={(timestamp) => {
                    mediaViewerRef.current?.handleSeekToTimestamp?.(timestamp);
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
                    setComments(
                      comments.filter((c) => c.id !== deletedCommentId)
                    );
                    if (mediaViewerRef.current?.loadComments) {
                      mediaViewerRef.current.loadComments();
                    }
                  }}
                  onCommentAdded={(newComment) => {
                    setComments([...comments, newComment]);
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
                    canComment,
                    canEditStatus,
                  }}
                  projectMode={true}
                  projectId={project.id}
                  createCommentOverride={handleCreateComment}
                  // deleteCommentOverride={handleDeleteComment}
                  // updateCommentOverride={handleUpdateComment}
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
