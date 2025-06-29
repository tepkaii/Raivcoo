// @ts-nocheck
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { MediaDisplay } from "@/app/review/[token]/review_components/MediaDisplay";
import { PlayerControls } from "@/app/review/[token]/review_components/PlayerControls";
import { VersionSelector } from "@/app/review/[token]/review_components/VersionSelector";
import { getCommentsAction } from "@/app/review/[token]/lib/actions";
import { MediaFile } from "@/app/dashboard/lib/types";

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

interface MediaViewerProps {
  media: MediaFile;
  allVersions?: MediaFile[];
  onClose?: () => void;
  onMediaChange?: (media: MediaFile) => void;
  onTimeUpdate?: (time: number) => void;
  currentTime?: number;
  showHeaderControls?: boolean;
  onCommentsUpdate?: (comments: MediaComment[]) => void;
  onAnnotationCreate?: (annotation: any) => void;
  onCommentPinClick?: (comment: MediaComment) => void;
  onCommentDrawingClick?: (comment: MediaComment) => void;
  // ❌ REMOVE THESE - they create circular dependencies
  // onAnnotationRequest?: (type: "pin" | "drawing" | "none", config: any) => void;
  // onClearActiveComments?: () => void;
}

export interface MediaViewerRef {
  handleCommentPinClick: (comment: MediaComment) => void;
  handleCommentDrawingClick: (comment: MediaComment) => void;
  handleSeekToTimestamp: (timestamp: number) => void;
  comments: MediaComment[];
  loadComments: () => void;
  // ✅ THESE ARE FOR EXTERNAL CALLS FROM PARENT
  handleAnnotationRequest: (
    type: "pin" | "drawing" | "none",
    config: any
  ) => void;
  clearActiveComments: () => void;
}

export const MediaViewer = forwardRef<MediaViewerRef, MediaViewerProps>(
  (
    {
      media,
      allVersions = [],
      onClose,
      onMediaChange,
      onTimeUpdate,
      currentTime = 0,
      showHeaderControls = true,
      onCommentsUpdate,
      onAnnotationCreate,
      onCommentPinClick,
      onCommentDrawingClick,
      // ❌ REMOVE THESE PROPS TO PREVENT CIRCULAR CALLS
    },
    ref
  ) => {
    const [currentMedia, setCurrentMedia] = useState<MediaFile>(media);
    const [comments, setComments] = useState<MediaComment[]>([]);
    const [activeCommentPin, setActiveCommentPin] = useState<string | null>(
      null
    );
    const [activeCommentDrawing, setActiveCommentDrawing] = useState<
      string | null
    >(null);
    const [internalCurrentTime, setInternalCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ✅ ANNOTATION STATES
    const [annotationMode, setAnnotationMode] = useState<
      "none" | "pin" | "drawing"
    >("none");
    const [annotationConfig, setAnnotationConfig] = useState<any>({});

    const videoRef = useRef<HTMLVideoElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    // Update current media when prop changes
    useEffect(() => {
      setCurrentMedia(media);
    }, [media]);

    // Load comments when media changes
    useEffect(() => {
      loadComments();
    }, [currentMedia.id]);

    // Add fullscreen event listener
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, []);

    // Load comments function
    const loadComments = async () => {
      try {
        const result = await getCommentsAction(currentMedia.id);
        if (result.success && result.comments) {
          setComments(result.comments);
          onCommentsUpdate?.(result.comments);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
      }
    };

    // ✅ FIXED: Annotation request handler - NO circular calls
    const handleAnnotationRequest = useCallback(
      (type: "pin" | "drawing" | "none", config: any) => {
        console.log("MediaViewer annotation request:", type, config);

        // Clear any active comment pins/drawings when starting new annotation OR canceling
        if (type !== "none") {
          console.log("Clearing active comments for new annotation");
          setActiveCommentPin(null);
          setActiveCommentDrawing(null);
        }

        if (type === "none") {
          console.log("Canceling annotation mode");
          setAnnotationMode("none");
          setAnnotationConfig({});
          setActiveCommentPin(null);
          setActiveCommentDrawing(null);
        } else {
          console.log("Setting annotation mode:", type);
          setAnnotationMode(type);
          setAnnotationConfig(config);
        }

        // ❌ DON'T call any parent functions here - this IS the handler
      },
      []
    );

    // ✅ FIXED: Clear active comments - NO circular calls
    const clearActiveComments = useCallback(() => {
      console.log("MediaViewer clearing active comments");
      setActiveCommentPin(null);
      setActiveCommentDrawing(null);
      // ❌ DON'T call onClearActiveComments - this IS the clear function
    }, []);

    // ✅ Handle annotation completion
    const handleAnnotationComplete = (annotationData: any) => {
      console.log("MediaViewer: Annotation completed", annotationData);
      // Reset annotation mode
      setAnnotationMode("none");
      setAnnotationConfig({});
      // Pass to parent
      onAnnotationCreate?.(annotationData);
    };

    // Handle comment pin click
    const handleCommentPinClick = (comment: MediaComment) => {
      if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
        // If this pin is already active, hide it (toggle off)
        if (activeCommentPin === comment.id) {
          setActiveCommentPin(null);
          return;
        }

        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentPin(comment.id);
      }
      onCommentPinClick?.(comment);
    };

    // Handle comment drawing click
    const handleCommentDrawingClick = (comment: MediaComment) => {
      if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
        // If this drawing is already active, hide it (toggle off)
        if (activeCommentDrawing === comment.id) {
          setActiveCommentDrawing(null);
          return;
        }

        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentDrawing(comment.id);
      }
      onCommentDrawingClick?.(comment);
    };

    // Clear active pin/drawing when time changes
    useEffect(() => {
      if (activeCommentPin && videoRef.current) {
        const activeComment = comments.find((c) => c.id === activeCommentPin);
        if (activeComment && activeComment.timestamp_seconds !== undefined) {
          const timeDiff = Math.abs(
            internalCurrentTime - activeComment.timestamp_seconds
          );
          if (timeDiff > 2 && !videoRef.current.paused) {
            setActiveCommentPin(null);
          }
        }
      }
    }, [internalCurrentTime, activeCommentPin, comments]);

    useEffect(() => {
      if (activeCommentDrawing && videoRef.current) {
        const activeComment = comments.find(
          (c) => c.id === activeCommentDrawing
        );
        if (activeComment && activeComment.timestamp_seconds !== undefined) {
          const timeDiff = Math.abs(
            internalCurrentTime - activeComment.timestamp_seconds
          );
          if (timeDiff > 2 && !videoRef.current.paused) {
            setActiveCommentDrawing(null);
          }
        }
      }
    }, [internalCurrentTime, activeCommentDrawing, comments]);

    // Handlers
    const handleVersionChange = (version: MediaFile) => {
      setCurrentMedia(version);
      onMediaChange?.(version);
    };

    const handleTimeUpdate = (time: number) => {
      setInternalCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleSeekToTimestamp = (timestamp: number) => {
      if (videoRef.current && currentMedia.file_type === "video") {
        videoRef.current.currentTime = timestamp;
        handleTimeUpdate(timestamp);
      }
    };

    // ✅ EXPOSE METHODS TO PARENT VIA REF
    useImperativeHandle(ref, () => ({
      handleCommentPinClick,
      handleCommentDrawingClick,
      handleSeekToTimestamp,
      comments,
      loadComments,
      handleAnnotationRequest, // ✅ For external calls FROM parent
      clearActiveComments, // ✅ For external calls FROM parent
    }));

    // Create the media content
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
            currentTime={currentTime || internalCurrentTime}
            annotationMode={annotationMode}
            annotationConfig={annotationConfig}
          />
        </div>

        {/* Player Controls */}
        <PlayerControls
          videoRef={videoRef}
          mediaType={currentMedia.file_type}
          comments={comments}
          onSeekToTimestamp={handleSeekToTimestamp}
          onTimeUpdate={handleTimeUpdate}
          fullscreenContainerRef={fullscreenContainerRef}
          className={
            isFullscreen ? "absolute bottom-0 left-0 right-0 z-50" : ""
          }
        />
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        {/* Optional Header */}
        {showHeaderControls && allVersions.length > 0 && (
          <div className="bg-background border-b border-gray-800 px-4 py-2 flex-shrink-0">
            <VersionSelector
              currentMedia={currentMedia}
              allVersions={allVersions}
              onVersionChange={handleVersionChange}
            />
          </div>
        )}

        {/* Media Content */}
        <div className="flex-1 min-h-0">{mediaContent}</div>
      </div>
    );
  }
);

MediaViewer.displayName = "MediaViewer";
