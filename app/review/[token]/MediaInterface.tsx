// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ReviewComments } from "./review_components/ReviewComments";
import { VersionSelector } from "./review_components/VersionSelector";
import { MediaDisplay } from "./review_components/MediaDisplay";
import { PlayerControls } from "./review_components/PlayerControls";
import { SplitPanel } from "@/app/components/SplitPanel";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getCommentsAction } from "./lib/actions";
import { MediaFile } from "@/app/dashboard/lib/types";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  annotation_data?: {
    id: string;
    x: number;
    y: number;
    mediaWidth: number;
    mediaHeight: number;
    createdAtScale: number;
    timestamp?: number;
    color?: string;
  };
  drawing_data?: {
    id: string;
    strokes: Array<{
      id: string;
      points: Array<{ x: number; y: number }>;
      color: string;
      thickness: number;
      timestamp?: number;
      mediaWidth: number;
      mediaHeight: number;
      createdAtScale: number;
    }>;
    timestamp?: number;
    mediaWidth: number;
    mediaHeight: number;
    createdAtScale: number;
  };
}

interface MediaInterface {
  media: MediaFile;
  allVersions?: MediaFile[];
  authenticatedUser?: { id: string; email: string; name: string } | null;
}

export const MediaInterface: React.FC<MediaInterface> = ({
  media,
  allVersions = [],
  authenticatedUser,
}) => {
  // States
  const [currentMedia, setCurrentMedia] = useState<MediaFile>(media);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [activeCommentPin, setActiveCommentPin] = useState<string | null>(null);
  const [activeCommentDrawing, setActiveCommentDrawing] = useState<
    string | null
  >(null);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Annotation states
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "pin" | "drawing"
  >("none");
  const [annotationConfig, setAnnotationConfig] = useState<any>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load comments when media changes
  useEffect(() => {
    loadComments();
  }, [currentMedia.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const loadComments = async () => {
    try {
      const result = await getCommentsAction(currentMedia.id);
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  // FIXED: Memoize the annotation request handler
  const handleAnnotationRequest = useCallback(
    (type: "pin" | "drawing" | "none", config: any) => {
      console.log("MediaInterface annotation request:", type, config);

      // Clear any active comment pins/drawings when starting new annotation OR canceling
      if (type !== "none") {
        console.log("Clearing active comments for new annotation");
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      }

      if (type === "none") {
        console.log("Canceling annotation mode");
        // Cancel annotation mode
        setAnnotationMode("none");
        setAnnotationConfig({});
        // Also clear active comments when canceling
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      } else {
        console.log("Setting annotation mode:", type);
        // Set annotation mode and config
        setAnnotationMode(type);
        setAnnotationConfig(config);
      }
    },
    []
  ); // Empty dependency array since this function doesn't depend on any state

  const handleAnnotationComplete = (annotationData: any) => {
    // Reset annotation mode
    setAnnotationMode("none");
    setAnnotationConfig({});

    // The annotation will be saved automatically by the ReviewComments component
  };

  const handleCommentDrawingClick = useCallback(
    (comment: MediaComment) => {
      if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
        // If this drawing is already active, hide it (toggle off)
        if (activeCommentDrawing === comment.id) {
          setActiveCommentDrawing(null);
          return;
        }

        // Otherwise show this drawing
        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentDrawing(comment.id);
      }
    },
    [activeCommentDrawing]
  );

  const clearActiveComments = useCallback(() => {
    console.log("MediaInterface clearing active comments");
    setActiveCommentPin(null);
    setActiveCommentDrawing(null);
  }, []);

  useEffect(() => {
    if (activeCommentDrawing && videoRef.current) {
      const activeComment = comments.find((c) => c.id === activeCommentDrawing);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        if (timeDiff > 2 && !videoRef.current.paused) {
          setActiveCommentDrawing(null);
        }
      }
    }
  }, [currentTime, activeCommentDrawing, comments]);

  const handleCommentAdded = useCallback((newComment: MediaComment) => {
    setComments((prev) => [...prev, newComment]);
  }, []);

  const handleCommentPinClick = useCallback(
    (comment: MediaComment) => {
      if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
        // If this pin is already active, hide it (toggle off)
        if (activeCommentPin === comment.id) {
          setActiveCommentPin(null);
          return;
        }

        // Otherwise show this pin
        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentPin(comment.id);
      }
    },
    [activeCommentPin]
  );

  useEffect(() => {
    if (activeCommentPin && videoRef.current) {
      const activeComment = comments.find((c) => c.id === activeCommentPin);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        if (timeDiff > 2 && !videoRef.current.paused) {
          setActiveCommentPin(null);
        }
      }
    }
  }, [currentTime, activeCommentPin, comments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVersionChange = (version: MediaFile) => {
    setCurrentMedia(version);
  };

  const handleSeekToTimestamp = useCallback(
    (timestamp: number) => {
      if (videoRef.current && currentMedia.file_type === "video") {
        videoRef.current.currentTime = timestamp;
      }
    },
    [currentMedia.file_type]
  );

  const handleCommentDeleted = useCallback((deletedCommentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedCommentId));
  }, []);

  // Create the main media content - THIS STAYS MOUNTED
  const mediaContent = (
    <div
      ref={fullscreenContainerRef}
      className={`flex flex-col h-full ${isFullscreen ? "bg-black relative" : ""}`}
    >
      <div
        className={`${isFullscreen ? "absolute inset-0" : "flex-1 min-h-0"}`}
      >
        <MediaDisplay
          media={currentMedia}
          videoRef={videoRef}
          className="h-full"
          onAnnotationComplete={handleAnnotationComplete}
          activeCommentPin={activeCommentPin}
          activeCommentDrawing={activeCommentDrawing}
          comments={comments}
          currentTime={currentTime}
          annotationMode={annotationMode}
          annotationConfig={annotationConfig}
        />
      </div>

      <PlayerControls
        videoRef={videoRef}
        mediaType={currentMedia.file_type}
        comments={comments}
        onSeekToTimestamp={handleSeekToTimestamp}
        onTimeUpdate={setCurrentTime}
        fullscreenContainerRef={fullscreenContainerRef}
        className={isFullscreen ? "absolute bottom-0 left-0 right-0 z-50" : ""}
      />
    </div>
  );

  const commentsContent = (
    <ReviewComments
      mediaId={currentMedia.id}
      mediaType={currentMedia.file_type}
      currentTime={currentTime}
      onSeekToTimestamp={handleSeekToTimestamp}
      className="h-full"
      onCommentPinClick={handleCommentPinClick}
      onCommentDrawingClick={handleCommentDrawingClick}
      onCommentDeleted={handleCommentDeleted}
      onCommentAdded={handleCommentAdded}
      onAnnotationRequest={handleAnnotationRequest}
      onClearActiveComments={clearActiveComments}
      authenticatedUser={authenticatedUser}
      activeCommentPin={activeCommentPin}
      activeCommentDrawing={activeCommentDrawing}
    />
  );

  // SINGLE LAYOUT that adapts with CSS and conditional rendering
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - adapts for mobile/desktop */}
      <header className="bg-background border-b px-3 md:px-4 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <h1
            className="text-base md:text-lg font-medium text-white truncate max-w-[200px]"
            title={currentMedia.original_filename}
          >
            {currentMedia.original_filename}
          </h1>

          <VersionSelector
            currentMedia={currentMedia}
            allVersions={allVersions}
            onVersionChange={handleVersionChange}
          />
        </div>

        {/* Desktop header info */}
        {!isMobile && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatFileSize(currentMedia.file_size)}</span>
            <span>•</span>
            <span>{formatDate(currentMedia.uploaded_at)}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          // MOBILE LAYOUT
          <div className="flex flex-col h-full">
            {/* Mobile Media Area */}
            <div className="h-[40vh] flex-shrink-0">{mediaContent}</div>

            {/* Mobile Comments Area */}
            <div className="flex-1 min-h-0 flex flex-col border-t border">
              {/* Mobile Comments Header */}
              <div className="border-b px-4 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                  Comments
                </h3>
              </div>

              {/* Mobile Comments Content */}
              <div className="flex-1 min-h-0">{commentsContent}</div>
            </div>
          </div>
        ) : (
          // DESKTOP LAYOUT
          <SplitPanel
            mode="review"
            leftPanel={mediaContent}
            rightPanel={commentsContent}
            showRightPanel={commentsVisible}
            onRightPanelToggle={setCommentsVisible}
            allowCloseRight={true}
            allowCloseLeft={false}
            rightPanelTitle="Comments"
            leftPanelTitle="Media"
            defaultRightPanelWidth={400}
            minRightPanelWidth={300}
            maxRightPanelWidth={600}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};
