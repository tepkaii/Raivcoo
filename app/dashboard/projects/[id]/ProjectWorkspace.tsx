// app/dashboard/projects/[id]/ProjectWorkspace.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { MediaGrid } from "./components/MediaGrid";
import { MediaViewer } from "./components/MediaViewer";
import { ReviewComments } from "@/app/review/[token]/ReviewComments";
import { RevButtons } from "@/components/ui/RevButtons";
import { MessageSquare, Eye, Grid3x3 } from "lucide-react";

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
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_media: MediaFile[];
}

interface ProjectWorkspaceProps {
  project: Project;
}

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);

  // Panel visibility states - BACK TO ORIGINAL 3 PANELS
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
    // DON'T auto-show media player - let user decide
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

  // Handle comments update from MediaViewer
  const handleCommentsUpdate = (newComments: any[]) => {
    setComments(newComments);
  };

  // Handle annotation creation from MediaViewer
  const handleAnnotationCreate = (annotation: any) => {
    setPendingAnnotation(annotation);
    // Auto-show comments panel when annotation is created
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

  // Complex locking rules - BACK TO ORIGINAL
  const canToggleMediaLibrary = (() => {
    if (!showMediaLibrary) return true; // Can always enable Media Library

    if (openPanelsCount === 1) return false; // Can't hide if it's the only panel

    if (openPanelsCount === 2) {
      // If Media Library + one other panel, Media Library is LOCKED
      // because hiding it would leave the other panel alone (not allowed)
      return false;
    }

    if (openPanelsCount === 3) {
      // If all 3 panels, Media Library can be hidden
      // because it leaves 2 panels (Player + Comments) which is allowed
      return true;
    }

    return false;
  })();

  const canTogglePlayer =
    showMediaLibrary || (!showMediaLibrary && showMediaPlayer);
  const canToggleComments =
    showMediaLibrary || (!showMediaLibrary && showCommentsPanel);

  // When Media Library is off, Player/Comments are locked (visible but can't be toggled)
  const playerLocked = !showMediaLibrary && showMediaPlayer;
  const commentsLocked = !showMediaLibrary && showCommentsPanel;

  // Handle Media Library toggle
  const handleMediaLibraryToggle = () => {
    if (!showMediaLibrary) {
      // Always allow enabling
      setShowMediaLibrary(true);
    } else if (canToggleMediaLibrary) {
      // Allow disabling if other panels exist
      setShowMediaLibrary(false);
      // DON'T auto-hide other panels - let them stay but become locked
    }
  };

  // Handle Media Player toggle
  const handleMediaPlayerToggle = () => {
    if (playerLocked) return; // Locked, can't toggle

    if (!showMediaPlayer) {
      // Can only enable if Media Library is on
      if (showMediaLibrary) {
        setShowMediaPlayer(true);
      }
    } else {
      // Can disable if not the only panel
      if (openPanelsCount > 1) {
        setShowMediaPlayer(false);
      }
    }
  };

  // Handle Comments toggle
  const handleCommentsToggle = () => {
    if (commentsLocked) return; // Locked, can't toggle

    if (!showCommentsPanel) {
      // Can only enable if Media Library is on
      if (showMediaLibrary) {
        setShowCommentsPanel(true);
      }
    } else {
      // Can disable if not the only panel
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

  // All your resizing handlers stay the same...
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
        // Handle resize between library and comments (when no player)
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

  // Event listeners for resizing
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
    <div className="h-screen flex flex-col  overflow-hidden">
      {/* Header with 3 Toggle Buttons - BACK TO ORIGINAL */}
      <div className=" border-b  px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>

          {/* 3 Panel Toggle Buttons */}
          <div className="flex items-center gap-2">
            {/* Media Library Toggle */}
            <RevButtons
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
              <Grid3x3 className="h-4 w-4 mr-2" />
              Media Library
              {showMediaLibrary && !canToggleMediaLibrary && (
                <span className="ml-1 text-xs opacity-60">🔒</span>
              )}
            </RevButtons>

            {/* Media Player Toggle */}
            <RevButtons
              onClick={handleMediaPlayerToggle}
              variant={showMediaPlayer ? "info" : "outline"}
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
              <Eye className="h-4 w-4 mr-2" />
              Media Player
              {(playerLocked ||
                (!showMediaPlayer && !showMediaLibrary) ||
                (showMediaPlayer && openPanelsCount === 1)) && (
                <span className="ml-1 text-xs opacity-60">🔒</span>
              )}
            </RevButtons>

            {/* Comments Toggle */}
            <RevButtons
              onClick={handleCommentsToggle}
              variant={showCommentsPanel ? "info" : "outline"}
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
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
              {(commentsLocked ||
                (!showCommentsPanel && !showMediaLibrary) ||
                (showCommentsPanel && openPanelsCount === 1)) && (
                <span className="ml-1 text-xs opacity-60">🔒</span>
              )}
            </RevButtons>
          </div>
        </div>
      </div>

      {/* Main Content Area - 3 Panel Layout */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Media Library Panel */}
        {showMediaLibrary && (
          <div
            className="border-r flex flex-col flex-shrink-0 min-w-0"
            style={{ width: `${widths.library}%` }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MediaGrid
                mediaFiles={mediaFiles}
                selectedMedia={selectedMedia}
                onMediaSelect={handleMediaSelect}
                onMediaUpdated={handleMediaUpdated}
                projectId={project.id}
              />
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
                  // Handle pin click from MediaViewer
                  if (mediaViewerRef.current) {
                    mediaViewerRef.current.handleCommentPinClick(comment);
                  }
                }}
                onCommentDrawingClick={(comment) => {
                  // Handle drawing click from MediaViewer
                  if (mediaViewerRef.current) {
                    mediaViewerRef.current.handleCommentDrawingClick(comment);
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center ">
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
            className=" border-l  flex flex-col flex-shrink-0 min-w-0"
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
                    // ← FIX THIS - was using arguments[0]
                    setComments(
                      comments.filter((c) => c.id !== deletedCommentId)
                    );
                    // Also reload comments in MediaViewer
                    if (mediaViewerRef.current?.loadComments) {
                      mediaViewerRef.current.loadComments();
                    }
                  }}
                  onCommentAdded={(newComment) => {
                    setComments([...comments, newComment]);
                    // Also reload comments in MediaViewer
                    if (mediaViewerRef.current?.loadComments) {
                      mediaViewerRef.current.loadComments();
                    }
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center ">
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
    </div>
  );
}
