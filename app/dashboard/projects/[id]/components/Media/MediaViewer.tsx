// app/dashboard/projects/[id]/components/media/MediaViewer.tsx
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
import { MediaDisplay } from "@/app/review/[token]/components/Display/MediaDisplay";
import { PlayerControls } from "@/app/review/[token]/components/Timeline/PlayerControls";
import { VersionSelector } from "@/app/review/[token]/components/VersionSelector";
import { getCommentsAction } from "@/app/review/[token]/lib/actions";
import { MediaFile } from "@/app/dashboard/types";
import { getFileCategory } from "@/app/dashboard/utilities";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  timestamp_start_seconds?: number; // ✅ ADD THIS
  timestamp_end_seconds?: number; // ✅ ADD THIS
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
  allowDownload?: boolean;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null;
  userPermissions?: {
    canComment?: boolean;
    canEditStatus?: boolean;
  };
  // ✅ ADD: Range selection props
  onRangeSelect?: (startTime: number, endTime: number) => void;
  isRangeSelectionMode?: boolean;
  onRangeSelectionModeChange?: (mode: boolean) => void;
  pendingRangeSelection?: { startTime: number; endTime: number } | null;
  onRangeSelectionComplete?: () => void;
}

export interface MediaViewerRef {
  handleCommentPinClick: (comment: MediaComment) => void;
  handleCommentDrawingClick: (comment: MediaComment) => void;
  handleSeekToTimestamp: (timestamp: number) => void;
  comments: MediaComment[];
  loadComments: () => void;
  handleAnnotationRequest: (
    type: "pin" | "drawing" | "none",
    config: any
  ) => void;
  clearActiveComments: () => void;
  // ✅ ADD: Range selection methods
  handleRangeCommentRequest: () => void;
  handleRangeSelectionComplete: () => void;
  unlockTimelineRange: () => void;
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
      allowDownload = true,
      authenticatedUser,
      userPermissions,
      // ✅ Range selection props from parent
      onRangeSelect,
      isRangeSelectionMode = false,
      onRangeSelectionModeChange,
      pendingRangeSelection,
      onRangeSelectionComplete,
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
    const audioRef = useRef<HTMLAudioElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    // ✅ GET FILE CATEGORY
    const fileCategory = getFileCategory(
      currentMedia.file_type,
      currentMedia.mime_type
    );
    const showPlayerControls =
      fileCategory === "video" || fileCategory === "audio";

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

    // ✅ UPDATED: Use parent's range selection handlers
    const handleRangeCommentRequest = useCallback(() => {
      onRangeSelectionModeChange?.(true);
    }, [onRangeSelectionModeChange]);

    const handleRangeSelect = useCallback(
      (startTime: number, endTime: number) => {
        onRangeSelect?.(startTime, endTime);
        onRangeSelectionModeChange?.(false);
      },
      [onRangeSelect, onRangeSelectionModeChange]
    );

    const handleRangeSelectionComplete = useCallback(() => {
      onRangeSelectionComplete?.();
      onRangeSelectionModeChange?.(false);
    }, [onRangeSelectionComplete, onRangeSelectionModeChange]);

    const unlockTimelineRange = useCallback(() => {
      // This will be called from ReviewComments to unlock the timeline
      if (
        typeof window !== "undefined" &&
        (window as any).unlockTimelineRange
      ) {
        (window as any).unlockTimelineRange();
      }
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
        // Clear any active comment pins/drawings when starting new annotation OR canceling
        if (type !== "none") {
          setActiveCommentPin(null);
          setActiveCommentDrawing(null);
        }

        if (type === "none") {
          setAnnotationMode("none");
          setAnnotationConfig({});
          setActiveCommentPin(null);
          setActiveCommentDrawing(null);
        } else {
          setAnnotationMode(type);
          setAnnotationConfig(config);
        }
      },
      []
    );

    // ✅ FIXED: Clear active comments - NO circular calls
    const clearActiveComments = useCallback(() => {
      setActiveCommentPin(null);
      setActiveCommentDrawing(null);
    }, []);

    // ✅ Handle annotation completion
    const handleAnnotationComplete = (annotationData: any) => {
      // Reset annotation mode
      setAnnotationMode("none");
      setAnnotationConfig({});
      // Pass to parent
      onAnnotationCreate?.(annotationData);
    };

    // Handle comment pin click
    const handleCommentPinClick = (comment: MediaComment) => {
      if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
        if (activeCommentPin === comment.id) {
          setActiveCommentPin(null);
          return;
        }

        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentPin(comment.id);
      }
    };

    // Handle comment drawing click
    const handleCommentDrawingClick = (comment: MediaComment) => {
      if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
        if (activeCommentDrawing === comment.id) {
          setActiveCommentDrawing(null);
          return;
        }

        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentDrawing(comment.id);
      }
    };

    // ✅ CLEAR ACTIVE PIN/DRAWING WHEN TIME CHANGES - FOR BOTH VIDEO AND AUDIO
    useEffect(() => {
      if (activeCommentPin && (videoRef.current || audioRef.current)) {
        const activeComment = comments.find((c) => c.id === activeCommentPin);
        if (activeComment && activeComment.timestamp_seconds !== undefined) {
          const timeDiff = Math.abs(
            internalCurrentTime - activeComment.timestamp_seconds
          );
          const mediaElement = videoRef.current || audioRef.current;
          if (timeDiff > 2 && mediaElement && !mediaElement.paused) {
            setActiveCommentPin(null);
          }
        }
      }
    }, [internalCurrentTime, activeCommentPin, comments]);

    useEffect(() => {
      if (activeCommentDrawing && (videoRef.current || audioRef.current)) {
        const activeComment = comments.find(
          (c) => c.id === activeCommentDrawing
        );
        if (activeComment && activeComment.timestamp_seconds !== undefined) {
          const timeDiff = Math.abs(
            internalCurrentTime - activeComment.timestamp_seconds
          );
          const mediaElement = videoRef.current || audioRef.current;
          if (timeDiff > 2 && mediaElement && !mediaElement.paused) {
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

    // ✅ HANDLE SEEKING FOR BOTH VIDEO AND AUDIO
    const handleSeekToTimestamp = (timestamp: number) => {
      if (fileCategory === "video" && videoRef.current) {
        videoRef.current.currentTime = timestamp;
        handleTimeUpdate(timestamp);
      } else if (fileCategory === "audio" && audioRef.current) {
        audioRef.current.currentTime = timestamp;
        handleTimeUpdate(timestamp);
      }
    };

    // ✅ EXPOSE METHODS TO PARENT VIA REF
    useImperativeHandle(ref, () => ({
      handleCommentPinClick: (comment: MediaComment) => {
        if (comment.annotation_data) {
          if (activeCommentPin === comment.id) {
            setActiveCommentPin(null);
            return;
          }

          // ✅ FIXED: Use the correct timestamp priority
          let seekTime = undefined;

          // Priority 1: Use annotation_data.timestamp (for pins created during range selection)
          if (comment.annotation_data.timestamp !== undefined) {
            seekTime = comment.annotation_data.timestamp;
          }
          // Priority 2: Use regular timestamp_seconds
          else if (comment.timestamp_seconds !== undefined) {
            seekTime = comment.timestamp_seconds;
          }
          // Priority 3: Use range start timestamp
          else if (comment.timestamp_start_seconds !== undefined) {
            seekTime = comment.timestamp_start_seconds;
          }

          if (seekTime !== undefined) {
            handleSeekToTimestamp(seekTime);
          }
          setActiveCommentPin(comment.id);
        }
      },

      handleCommentDrawingClick: (comment: MediaComment) => {
        if (comment.drawing_data) {
          if (activeCommentDrawing === comment.id) {
            setActiveCommentDrawing(null);
            return;
          }

          // ✅ FIXED: Use the correct timestamp priority
          let seekTime = undefined;

          // Priority 1: Use drawing_data.timestamp (for drawings created during range selection)
          if (comment.drawing_data.timestamp !== undefined) {
            seekTime = comment.drawing_data.timestamp;
          }
          // Priority 2: Use regular timestamp_seconds
          else if (comment.timestamp_seconds !== undefined) {
            seekTime = comment.timestamp_seconds;
          }
          // Priority 3: Use range start timestamp
          else if (comment.timestamp_start_seconds !== undefined) {
            seekTime = comment.timestamp_start_seconds;
          }

          if (seekTime !== undefined) {
            handleSeekToTimestamp(seekTime);
          }
          setActiveCommentDrawing(comment.id);
        }
      },

      handleSeekToTimestamp,
      comments,
      loadComments,
      handleAnnotationRequest,
      clearActiveComments,
      // ✅ Range selection methods - use parent handlers
      handleRangeCommentRequest,
      handleRangeSelectionComplete,
      unlockTimelineRange,
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
            audioRef={audioRef}
            className="h-full"
            onAnnotationComplete={handleAnnotationComplete}
            activeCommentPin={activeCommentPin}
            activeCommentDrawing={activeCommentDrawing}
            comments={comments}
            currentTime={currentTime || internalCurrentTime}
            annotationMode={annotationMode}
            annotationConfig={annotationConfig}
            allowDownload={allowDownload}
          />
        </div>

        {/* ✅ ONLY SHOW PLAYER CONTROLS FOR VIDEO AND AUDIO */}
        {showPlayerControls && (
          <PlayerControls
            videoRef={videoRef}
            audioRef={audioRef}
            mediaType={currentMedia.file_type}
            media={currentMedia}
            comments={comments}
            onSeekToTimestamp={handleSeekToTimestamp}
            onTimeUpdate={handleTimeUpdate}
            authenticatedUser={authenticatedUser}
            fullscreenContainerRef={fullscreenContainerRef}
            className={
              isFullscreen ? "absolute bottom-0 left-0 right-0 z-50" : ""
            }
            // ✅ UPDATED: Pass parent's range selection props
            onRangeSelect={handleRangeSelect}
            isRangeSelectionMode={isRangeSelectionMode} // ✅ FROM PARENT
            onRangeSelectionModeChange={onRangeSelectionModeChange} // ✅ FROM PARENT
            pendingRangeSelection={pendingRangeSelection} // ✅ FROM PARENT
            onRangeSelectionComplete={handleRangeSelectionComplete}
          />
        )}
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