"use client";

import React, { useState, useRef, useCallback } from "react";
import { MediaGrid } from "./components/MediaGrid";
import { MediaViewer } from "./components/MediaViewer";
import { ReviewComments } from "@/app/review/[token]/ReviewComments";

import { MessageSquare, Eye, Grid3x3, SquarePlay } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface ReviewLink {
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  media_id: string;
  password_hash?: string;
  requires_password: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_media: MediaFile[];
  review_links: ReviewLink[];
}

interface ProjectWorkspaceProps {
  project: Project;
}

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>(
    project.review_links || []
  );
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);

  // Panel visibility states
  const [showMediaLibrary, setShowMediaLibrary] = useState(true);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  // Panel widths as percentages
  const [libraryWidth, setLibraryWidth] = useState(30);
  const [playerWidth, setPlayerWidth] = useState(45);
  const [commentsWidth, setCommentsWidth] = useState(25);

  const [isResizing, setIsResizing] = useState<
    "library-player" | "player-comments" | "library-comments" | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaViewerRef = useRef<any>(null);

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

  // Handle comments update from MediaViewer
  const handleCommentsUpdate = (newComments: any[]) => {
    setComments(newComments);
  };

  // Handle annotation creation from MediaViewer
  const handleAnnotationCreate = (annotation: any) => {
    setPendingAnnotation(annotation);
    if (!showCommentsPanel) {
      setShowCommentsPanel(true);
    }
  };

  // Count open panels
  const openPanelsCount = [
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
  ].filter(Boolean).length;

  // Panel toggle logic
  const canToggleMediaLibrary = (() => {
    if (!showMediaLibrary) return true;
    if (openPanelsCount === 1) return false;
    if (openPanelsCount === 2) return false;
    if (openPanelsCount === 3) return true;
    return false;
  })();

  const canTogglePlayer =
    showMediaLibrary || (!showMediaLibrary && showMediaPlayer);
  const canToggleComments =
    showMediaLibrary || (!showMediaLibrary && showCommentsPanel);

  const playerLocked = !showMediaLibrary && showMediaPlayer;
  const commentsLocked = !showMediaLibrary && showCommentsPanel;

  const handleMediaLibraryToggle = () => {
    if (!showMediaLibrary) {
      setShowMediaLibrary(true);
    } else if (canToggleMediaLibrary) {
      setShowMediaLibrary(false);
    }
  };

  const handleMediaPlayerToggle = () => {
    if (playerLocked) return;

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
    if (commentsLocked) return;

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

  // Calculate widths based on what panels are open
  const calculateWidths = () => {
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
  };

  const widths = calculateWidths();

  // Resizing handlers (same as before)
  const handleResizeStart = useCallback(
    (
      type: "library-player" | "player-comments" | "library-comments",
      e: React.MouseEvent
    ) => {
      setIsResizing(type);
      e.preventDefault();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

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
    [isResizing, libraryWidth, showMediaLibrary, showCommentsPanel]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <header className="h-screen flex flex-col overflow-hidden">
      {/* Header with 3 Toggle Buttons */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white">
            {project.name}-Project
          </h1>
          {/* {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )} */}
        </div>

        {/* 3 Panel Toggle Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleMediaLibraryToggle}
            variant={showMediaLibrary ? "default" : "outline"}
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
            <Grid3x3 className="h-4 w-4 " />

            {showMediaLibrary && !canToggleMediaLibrary && (
              <span className="ml-1 text-xs opacity-60">🔒</span>
            )}
          </Button>

          <Button
            onClick={handleMediaPlayerToggle}
            variant={showMediaPlayer ? "destructive" : "outline"}
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
            <SquarePlay className="h-4 " />

            {(playerLocked ||
              (!showMediaPlayer && !showMediaLibrary) ||
              (showMediaPlayer && openPanelsCount === 1)) && (
              <span className="ml-1 text-xs opacity-60">🔒</span>
            )}
          </Button>

          <Button
            onClick={handleCommentsToggle}
            variant={showCommentsPanel ? "destructive" : "outline"}
            size="sm"
            disabled={
              commentsLocked ||
              (!showCommentsPanel && !showMediaLibrary) ||
              (showCommentsPanel && openPanelsCount === 1)
            }
            title={
              commentsLocked
                ? "Enable Media Library to toggle Comments"
                : !showCommentsPanel && !showMediaLibrary
                  ? "Enable Media Library first to use Comments"
                  : showCommentsPanel && openPanelsCount === 1
                    ? "Cannot hide the only remaining panel"
                    : undefined
            }
          >
            <MessageSquare className="h-4 w-4 " />

            {(commentsLocked ||
              (!showCommentsPanel && !showMediaLibrary) ||
              (showCommentsPanel && openPanelsCount === 1)) && (
              <span className="ml-1 text-xs opacity-60">🔒</span>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Area - 3 Panel Layout */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Media Library Panel */}
        {showMediaLibrary && (
          <div
            className="border-r flex flex-col flex-shrink-0 min-w-0"
            style={{ width: `${widths.library}%` }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="w-full h-full">
                {" "}
                {/* Add this wrapper */}
                <MediaGrid
                  mediaFiles={mediaFiles}
                  reviewLinks={reviewLinks}
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleMediaSelect}
                  onMediaUpdated={handleMediaUpdated}
                  onReviewLinksUpdated={handleReviewLinksUpdated}
                  projectId={project.id}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resize Handle between Library and Player */}
        {showMediaLibrary && showMediaPlayer && (
          <div
            className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
            onMouseDown={(e) => handleResizeStart("library-player", e)}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Resize Handle between Library and Comments (when no player) */}
        {showMediaLibrary && showCommentsPanel && !showMediaPlayer && (
          <div
            className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
            onMouseDown={(e) => handleResizeStart("library-comments", e)}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Media Player Panel */}
        {showMediaPlayer && (
          <div
            className="bg-black flex flex-col min-w-0 flex-shrink-0"
            style={{ width: `${widths.player}%` }}
          >
            {playerLocked && (
              <div className="bg-orange-600 text-white text-xs px-2 py-1 text-center">
                🔒 Locked - Enable Media Library to toggle
              </div>
            )}
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
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select Media</h3>
                  <p className="text-sm">Choose a video or image to view</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resize Handle between Player and Comments */}
        {showMediaPlayer && showCommentsPanel && (
          <div
            className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize relative group flex-shrink-0"
            onMouseDown={(e) => handleResizeStart("player-comments", e)}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Comments Panel */}
        {showCommentsPanel && (
          <div
            className="border-l flex flex-col flex-shrink-0 min-w-0"
            style={{ width: `${widths.comments}%` }}
          >
            {commentsLocked && (
              <div className="bg-orange-600 text-white text-xs px-2 py-1 text-center">
                🔒 Locked - Enable Media Library to toggle
              </div>
            )}

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
                  pendingAnnotation={pendingAnnotation}
                  onAnnotationSaved={() => setPendingAnnotation(null)}
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
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select Media</h3>
                    <p className="text-sm">Choose media to view comments</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
