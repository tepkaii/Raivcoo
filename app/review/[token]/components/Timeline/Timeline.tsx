"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileCategory } from "@/app/dashboard/utilities";

interface MediaComment {
  user_id?: string;
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  timestamp_start_seconds?: number;
  timestamp_end_seconds?: number;
  avatar_url?: string;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface TimelineProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  audioRef?: React.RefObject<HTMLAudioElement>;
  mediaType: "video" | "image" | "audio" | "document" | "svg";
  media?: any;
  comments?: MediaComment[];
  currentTime: number;
  duration: number;
  isMediaReady: boolean;
  isMobile: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  onProgressInteraction: (clientX: number) => void;
  onTimelineCommentClick: (timestamp: number) => void;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null;
  formatTime: (time: number) => string;
  getInitials: (name: string) => string;
  className?: string;
  isRangeSelectionMode?: boolean;
  onRangeSelect?: (startTime: number, endTime: number) => void;
  onRangeSelectionCancel?: () => void;
  pendingRangeSelection?: { startTime: number; endTime: number } | null;
  onRangeUnlock?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  videoRef,
  audioRef,
  mediaType,
  media,
  comments = [],
  currentTime,
  duration,
  isMediaReady,
  isMobile,
  isDragging,
  setIsDragging,
  onProgressInteraction,
  onTimelineCommentClick,
  authenticatedUser,
  formatTime,
  getInitials,
  className = "",
  isRangeSelectionMode = false,
  onRangeSelect,
  onRangeSelectionCancel,
  pendingRangeSelection,
  onRangeUnlock,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // ✅ Range selection states
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [tempRangeEnd, setTempRangeEnd] = useState<number | null>(null);

  // ✅ NEW: Mobile touch states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [lastTouchX, setLastTouchX] = useState<number | null>(null);

  // ✅ NEW: Store if video was playing before range selection
  const [wasPlayingBeforeRange, setWasPlayingBeforeRange] = useState(false);

  // ✅ NEW: Range locking state
  const [lockedRange, setLockedRange] = useState<{
    startTime: number;
    endTime: number;
  } | null>(null);

  // ✅ NEW: Track if user has started dragging (minimum distance)
  const [hasDraggedMinDistance, setHasDraggedMinDistance] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // ✅ Get media element for video playback during range selection
  const getMediaElement = () => {
    if (fileCategory === "video") return videoRef?.current;
    if (fileCategory === "audio") return audioRef?.current;
    return null;
  };

  // ✅ DETERMINE FILE CATEGORY
  const fileCategory = media
    ? getFileCategory(media.file_type, media.mime_type)
    : mediaType;

  // ✅ EARLY RETURN - ONLY SHOW FOR VIDEO AND AUDIO
  if (fileCategory !== "video" && fileCategory !== "audio") {
    return null;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ✅ NEW: Range lock enforcement
  useEffect(() => {
    const mediaElement = getMediaElement();
    if (!mediaElement || !lockedRange || !isMediaReady) return;

    const handleTimeUpdate = () => {
      // ✅ ENFORCE RANGE LOCK - if playback goes beyond range, loop back to start
      if (mediaElement.currentTime >= lockedRange.endTime) {
        mediaElement.currentTime = lockedRange.startTime;
      }
      // ✅ PREVENT SEEKING BEFORE RANGE START
      if (mediaElement.currentTime < lockedRange.startTime) {
        mediaElement.currentTime = lockedRange.startTime;
      }
    };

    mediaElement.addEventListener("timeupdate", handleTimeUpdate);
    return () =>
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
  }, [lockedRange, fileCategory, isMediaReady]);

  // ✅ NEW: Get time position from event (works for both mouse and touch)
  const getTimeFromEvent = useCallback(
    (clientX: number) => {
      const progressElement = progressRef.current;
      if (!progressElement) return null;

      const rect = progressElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pos * duration;
    },
    [duration]
  );

  // ✅ ENHANCED: Range selection handlers with drag validation
  const handleRangeStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!isRangeSelectionMode || !isMediaReady || duration === 0) return;

      const time = getTimeFromEvent(clientX);
      if (time === null) return;

      // ✅ Set initial drag position and reset drag state
      setDragStartPosition({ x: clientX, y: clientY });
      setHasDraggedMinDistance(false);

      // ✅ Store if video was playing before range selection
      const mediaElement = getMediaElement();
      if (mediaElement) {
        setWasPlayingBeforeRange(!mediaElement.paused);
        // ✅ PAUSE video during range selection (no autoplay)
        mediaElement.pause();
        // ✅ Seek to start position WITHOUT playing
        mediaElement.currentTime = time;
      }

      setRangeStart(time);
      setRangeEnd(null);
      setTempRangeEnd(null);
      setIsRangeSelecting(true);
    },
    [
      isRangeSelectionMode,
      isMediaReady,
      duration,
      fileCategory,
      getTimeFromEvent,
    ]
  );

  const handleRangeMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isRangeSelecting || rangeStart === null || !isMediaReady) return;

      // ✅ Check if user has dragged minimum distance (5px)
      if (!hasDraggedMinDistance && dragStartPosition) {
        const distance = Math.sqrt(
          Math.pow(clientX - dragStartPosition.x, 2) +
            Math.pow(clientY - dragStartPosition.y, 2)
        );

        if (distance >= 5) {
          setHasDraggedMinDistance(true);
        } else {
          // Not dragged enough, don't create range yet
          return;
        }
      }

      const time = getTimeFromEvent(clientX);
      if (time === null) return;

      setTempRangeEnd(time);

      // ✅ Update video time WITHOUT playing (just seek for preview)
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.currentTime = time;
        // ✅ Ensure video stays paused during range selection
        if (!mediaElement.paused) {
          mediaElement.pause();
        }
      }
    },
    [
      isRangeSelecting,
      rangeStart,
      isMediaReady,
      fileCategory,
      getTimeFromEvent,
      hasDraggedMinDistance,
      dragStartPosition,
    ]
  );

  const handleRangeEnd = useCallback(() => {
    if (!isRangeSelecting || rangeStart === null) return;

    // ✅ Only create range if user has dragged minimum distance
    if (!hasDraggedMinDistance || tempRangeEnd === null) {
      // Reset everything - no range created
      setRangeStart(null);
      setRangeEnd(null);
      setTempRangeEnd(null);
      setIsRangeSelecting(false);
      setHasDraggedMinDistance(false);
      setDragStartPosition(null);

      // ✅ Restore video play state
      const mediaElement = getMediaElement();
      if (mediaElement && wasPlayingBeforeRange) {
        mediaElement.play().catch(console.error);
      }
      return;
    }

    const startTime = Math.min(rangeStart, tempRangeEnd);
    const endTime = Math.max(rangeStart, tempRangeEnd);

    // Only confirm if there's a meaningful range (at least 1 second)
    if (endTime - startTime >= 1) {
      setRangeEnd(endTime);
      setRangeStart(startTime);
    } else {
      // Too short, cancel
      setRangeStart(null);
      setRangeEnd(null);

      // ✅ If range was too short, restore previous play state
      const mediaElement = getMediaElement();
      if (mediaElement && wasPlayingBeforeRange) {
        mediaElement.play().catch(console.error);
      }
    }

    setTempRangeEnd(null);
    setIsRangeSelecting(false);
    setHasDraggedMinDistance(false);
    setDragStartPosition(null);
  }, [
    isRangeSelecting,
    rangeStart,
    tempRangeEnd,
    wasPlayingBeforeRange,
    fileCategory,
    hasDraggedMinDistance,
  ]);

  // ✅ NEW: Mouse handlers for range selection
  const handleRangeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleRangeStart(e.clientX, e.clientY);
    },
    [handleRangeStart]
  );

  // ✅ NEW: Touch handlers for mobile range selection
  const handleRangeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isRangeSelectionMode || e.touches.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      setTouchStartX(touch.clientX);
      setLastTouchX(touch.clientX);
      handleRangeStart(touch.clientX, touch.clientY);
    },
    [isRangeSelectionMode, handleRangeStart]
  );

  const handleRangeTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isRangeSelecting || e.touches.length === 0) return;

      e.preventDefault();

      const touch = e.touches[0];
      setLastTouchX(touch.clientX);
      handleRangeMove(touch.clientX, touch.clientY);
    },
    [isRangeSelecting, handleRangeMove]
  );

  const handleRangeTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isRangeSelecting) return;

      e.preventDefault();
      handleRangeEnd();

      setTouchStartX(null);
      setLastTouchX(null);
    },
    [isRangeSelecting, handleRangeEnd]
  );

  // ✅ ENHANCED GLOBAL MOUSE HANDLERS
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isRangeSelecting) return;
      handleRangeMove(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (isRangeSelecting) {
        handleRangeEnd();
      }
    };

    if (isRangeSelecting) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isRangeSelecting, handleRangeMove, handleRangeEnd]);

  // ✅ NEW: Global touch handlers for mobile
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isRangeSelecting || e.touches.length === 0) return;

      e.preventDefault();
      const touch = e.touches[0];
      setLastTouchX(touch.clientX);
      handleRangeMove(touch.clientX, touch.clientY);
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isRangeSelecting) {
        e.preventDefault();
        handleRangeEnd();
        setTouchStartX(null);
        setLastTouchX(null);
      }
    };

    if (isRangeSelecting && isMobile) {
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalTouchEnd, {
        passive: false,
      });

      return () => {
        document.removeEventListener("touchmove", handleGlobalTouchMove);
        document.removeEventListener("touchend", handleGlobalTouchEnd);
      };
    }
  }, [isRangeSelecting, isMobile, handleRangeMove, handleRangeEnd]);

  // ✅ NEW: Modified confirm range selection with range locking
  const confirmRangeSelection = useCallback(() => {
    if (rangeStart !== null && rangeEnd !== null) {
      const startTime = Math.min(rangeStart, rangeEnd);
      const endTime = Math.max(rangeStart, rangeEnd);

      // Set locked range and seek to start
      setLockedRange({ startTime, endTime });
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.currentTime = startTime;
      }

      onRangeSelect?.(startTime, endTime);
    }

    // Reset range selection state but keep locked range
    setRangeStart(null);
    setRangeEnd(null);
    setTempRangeEnd(null);
    setIsRangeSelecting(false);
    setWasPlayingBeforeRange(false);
    setHasDraggedMinDistance(false);
    setDragStartPosition(null);
  }, [rangeStart, rangeEnd, onRangeSelect, fileCategory]);

  // ✅ NEW: Function to unlock range
  const unlockRange = useCallback(() => {
    setLockedRange(null);
    // Clear all range selection states when unlocking
    setRangeStart(null);
    setRangeEnd(null);
    setTempRangeEnd(null);
    setIsRangeSelecting(false);
    setWasPlayingBeforeRange(false);
    setHasDraggedMinDistance(false);
    setDragStartPosition(null);

    // Call the parent's unlock function too
    onRangeUnlock?.();
  }, [onRangeUnlock]);

  // ✅ EXPOSE: Set up the unlock function for ReviewComments to call
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).unlockTimelineRange = unlockRange;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).unlockTimelineRange;
      }
    };
  }, [unlockRange]);

  // ✅ CANCEL RANGE SELECTION
  const cancelRangeSelection = useCallback(() => {
    // Clear locked range when cancelling
    setLockedRange(null);

    const mediaElement = getMediaElement();
    if (mediaElement && wasPlayingBeforeRange) {
      mediaElement.play().catch(console.error);
    }

    setRangeStart(null);
    setRangeEnd(null);
    setTempRangeEnd(null);
    setIsRangeSelecting(false);
    setWasPlayingBeforeRange(false);
    setHasDraggedMinDistance(false);
    setDragStartPosition(null);

    // ✅ Call parent's cancel function to also clear ReviewComments range mode
    onRangeSelectionCancel?.();

    // ✅ FIXED: Also call MediaInterface's unlockTimelineRange which will unlock ReviewComments
    if (
      typeof window !== "undefined" &&
      (window as any).mediaInterfaceUnlockRange
    ) {
      (window as any).mediaInterfaceUnlockRange();
    }
  }, [onRangeSelectionCancel, wasPlayingBeforeRange, fileCategory]);

  // ✅ MODIFIED: Regular timeline interaction (when not in range mode) - respects locked range
  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      if (isRangeSelectionMode) return;

      // ✅ NEW: Modified to respect locked range
      if (lockedRange) {
        const progressElement = progressRef.current;
        if (!progressElement) return;

        const rect = progressElement.getBoundingClientRect();
        const pos = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        const requestedTime = pos * duration;

        // ✅ Constrain to locked range
        const constrainedTime = Math.max(
          lockedRange.startTime,
          Math.min(lockedRange.endTime, requestedTime)
        );

        const mediaElement = getMediaElement();
        if (mediaElement) {
          mediaElement.currentTime = constrainedTime;
        }
      } else {
        onProgressInteraction(e.clientX);
      }
    },
    [
      onProgressInteraction,
      isRangeSelectionMode,
      lockedRange,
      duration,
      fileCategory,
    ]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isRangeSelectionMode) {
        handleRangeMouseDown(e);
        return;
      }

      if (!isMediaReady) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      handleProgressClick(e);
    },
    [
      isRangeSelectionMode,
      handleRangeMouseDown,
      isMediaReady,
      setIsDragging,
      handleProgressClick,
    ]
  );

  // ✅ NEW: Touch handlers for progress bar
  const handleProgressTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRangeSelectionMode) {
        handleRangeTouchStart(e);
        return;
      }

      if (!isMediaReady || e.touches.length === 0) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const touch = e.touches[0];
      onProgressInteraction(touch.clientX);
    },
    [
      isRangeSelectionMode,
      handleRangeTouchStart,
      isMediaReady,
      setIsDragging,
      onProgressInteraction,
    ]
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent) => {
      if (isRangeSelectionMode || !isMediaReady || isMobile) return;

      const progressElement = progressRef.current;
      if (!progressElement || duration === 0) return;

      const rect = progressElement.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const time = pos * duration;
      setHoverTime(time);
      setHoverPosition(e.clientX - rect.left);
    },
    [duration, isRangeSelectionMode, isMediaReady, isMobile]
  );

  // ✅ CALCULATE RANGE DISPLAY VALUES
  const getRangeDisplayValues = () => {
    if (pendingRangeSelection) {
      const startPercent = (pendingRangeSelection.startTime / duration) * 100;
      const endPercent = (pendingRangeSelection.endTime / duration) * 100;
      return { startPercent, endPercent, width: endPercent - startPercent };
    }

    if (rangeStart !== null && rangeEnd !== null) {
      const startTime = Math.min(rangeStart, rangeEnd);
      const endTime = Math.max(rangeStart, rangeEnd);
      const startPercent = (startTime / duration) * 100;
      const endPercent = (endTime / duration) * 100;
      return { startPercent, endPercent, width: endPercent - startPercent };
    }

    // ✅ Only show temp range if user has dragged minimum distance
    if (rangeStart !== null && tempRangeEnd !== null && hasDraggedMinDistance) {
      const startTime = Math.min(rangeStart, tempRangeEnd);
      const endTime = Math.max(rangeStart, tempRangeEnd);
      const startPercent = (startTime / duration) * 100;
      const endPercent = (endTime / duration) * 100;
      return { startPercent, endPercent, width: endPercent - startPercent };
    }

    return null;
  };

  const rangeDisplay = getRangeDisplayValues();

  // ✅ NEW: Calculate locked range display
  const getLockedRangeDisplay = () => {
    if (!lockedRange) return null;
    const startPercent = (lockedRange.startTime / duration) * 100;
    const endPercent = (lockedRange.endTime / duration) * 100;
    return { startPercent, endPercent, width: endPercent - startPercent };
  };

  const lockedRangeDisplay = getLockedRangeDisplay();

  if (!isMediaReady) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm min-w-12">0:00</span>
          <div className="flex-1 relative">
            <div className="h-2 bg-white/20 rounded-full relative">
              <div className="h-full bg-gray-500 rounded-full w-0" />
            </div>
          </div>
          <span className="text-white font-mono text-sm min-w-12">0:00</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Progress Bar with Playhead */}
      <div className="flex items-center gap-4">
        <span className="text-white font-mono text-sm min-w-12">
          {formatTime(currentTime)}
        </span>

        <div className="flex-1 relative">
          <div
            ref={progressRef}
            data-timeline-progress
            className={`h-2 bg-white/20 rounded-full relative transition-colors ${
              isRangeSelectionMode
                ? "cursor-crosshair hover:bg-yellow-500/30"
                : "cursor-pointer hover:bg-white/30"
            } ${isMobile ? "h-3" : "h-2"}`}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={
              isRangeSelectionMode ? handleRangeTouchMove : undefined
            }
            onTouchEnd={isRangeSelectionMode ? handleRangeTouchEnd : undefined}
            onClick={isRangeSelectionMode ? undefined : handleProgressClick}
            onMouseMove={isRangeSelectionMode ? undefined : handleProgressHover}
            onMouseLeave={() => {
              if (!isRangeSelectionMode) {
                setHoverTime(null);
                setHoverPosition(null);
              }
            }}
            style={{
              touchAction: isRangeSelectionMode ? "none" : "auto",
            }}
          >
            {/* Progress background */}
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* ✅ NEW: Locked Range Background Overlay */}
            {lockedRangeDisplay && (
              <div
                className="absolute top-0 h-full bg-red-500/20 border border-red-500/40 rounded-[2px]"
                style={{
                  left: `${lockedRangeDisplay.startPercent}%`,
                  width: `${lockedRangeDisplay.width}%`,
                  zIndex: 2,
                }}
              >
                {/* ✅ Start point indicator (left side) */}
                <div
                  className={`absolute top-1/2 left-0 ${
                    isMobile ? "w-[6px] h-6" : "w-[5px] h-5"
                  } bg-red-500 rounded-[2px]`}
                  style={{
                    left: "-6px",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                  }}
                />

                {/* ✅ End point indicator (right side) */}
                <div
                  className={`absolute top-1/2 ${
                    isMobile ? "w-[6px] h-6" : "w-[5px] h-5"
                  } bg-red-500 rounded-[2px]`}
                  style={{
                    right: "-2px",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                  }}
                />
              </div>
            )}

            {/* ✅ ENHANCED RANGE SELECTION OVERLAY WITH VISUAL INDICATORS */}
            {rangeDisplay && (
              <div
                className={`absolute top-0 h-full rounded-[2px] ${
                  pendingRangeSelection
                    ? "bg-yellow-500/40 border border-yellow-500/60"
                    : "bg-yellow-500/60 border border-yellow-500"
                }`}
                style={{
                  left: `${rangeDisplay.startPercent}%`,
                  width: `${rangeDisplay.width}%`,
                  zIndex: 5,
                }}
              >
                {/* ✅ Start point indicator with individual time tooltip */}
                <div
                  className={`absolute top-1/2 left-0 ${
                    isMobile ? "w-[6px] h-6" : "w-[5px] h-5"
                  } bg-yellow-500 rounded-[2px] group`}
                  style={{
                    left: "-6px",
                    transform: "translateY(-50%)",
                    zIndex: 6,
                  }}
                >
                  {/* ✅ Start time tooltip - always visible during range selection */}
                  {(rangeStart !== null || pendingRangeSelection) && (
                    <div
                      className={`absolute ${
                        isMobile ? "-top-10" : "-top-8"
                      } left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-mono whitespace-nowrap z-50`}
                    >
                      {formatTime(
                        pendingRangeSelection
                          ? pendingRangeSelection.startTime
                          : Math.min(
                              rangeStart!,
                              tempRangeEnd || rangeEnd || rangeStart!
                            )
                      )}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-yellow-500" />
                    </div>
                  )}
                </div>

                {/* ✅ End point indicator with individual time tooltip AND buttons */}
                <div
                  className={`absolute top-1/2 ${
                    isMobile ? "w-[6px] h-6" : "w-[5px] h-5"
                  } bg-yellow-500 rounded-[2px] group`}
                  style={{
                    right: "-2px",
                    transform: "translateY(-50%)",
                    zIndex: 6,
                  }}
                >
                  {/* ✅ End time tooltip - always visible during range selection */}
                  {(tempRangeEnd !== null ||
                    rangeEnd !== null ||
                    pendingRangeSelection) &&
                    hasDraggedMinDistance && (
                      <div
                        className={`absolute ${
                          isMobile ? "-top-10" : "-top-8"
                        } left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-mono whitespace-nowrap z-50`}
                      >
                        {formatTime(
                          pendingRangeSelection
                            ? pendingRangeSelection.endTime
                            : Math.max(
                                rangeStart!,
                                tempRangeEnd || rangeEnd || rangeStart!
                              )
                        )}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-yellow-500" />
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Regular playhead - Always visible and draggable (when not in range mode) */}
            {!isRangeSelectionMode && (
              <div
                className={`absolute top-1/2 ${
                  isMobile ? "w-4 h-6" : "w-2 h-4"
                } bg-white shadow-lg border border-blue-500 transition-transform hover:scale-110 pointer-events-none`}
                style={{
                  left: `${progressPercentage}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                  zIndex: 10,
                }}
              />
            )}
          </div>
          {/* ✅ Action buttons positioned beside the end point - only show when range is complete */}
          {isRangeSelectionMode &&
            rangeStart !== null &&
            rangeEnd !== null &&
            rangeDisplay && (
              <div
                className={`absolute top-1/2 transform -translate-y-8 flex items-center gap-1 z-[100]`}
                style={{
                  left: `calc(${rangeDisplay.startPercent + rangeDisplay.width}% + ${isMobile ? "12px" : "10px"})`, // Position relative to end point
                }}
              >
                <Button
                  onClick={confirmRangeSelection}
                  size="icon"
                  className={`${
                    isMobile ? "h-6 w-6" : "h-5 w-5"
                  } bg-green-500 hover:bg-green-600 p-0 flex-shrink-0`}
                  title="Confirm range selection"
                >
                  <Check className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                </Button>
                <Button
                  onClick={cancelRangeSelection}
                  size="icon"
                  variant="outline"
                  className={`${
                    isMobile ? "h-6 w-6" : "h-5 w-5"
                  } p-0 flex-shrink-0`}
                  title="Cancel range selection"
                >
                  <X className={isMobile ? "h-3 w-3" : "h-2.5 w-2.5"} />
                </Button>
              </div>
            )}
          {/* Time tooltip (only when not in range mode) */}
          {!isRangeSelectionMode &&
            hoverTime !== null &&
            hoverPosition !== null &&
            !isMobile && (
              <div
                className="border-2 border-black/20 absolute -top-8 bg-[#0070F3] text-white text-xs px-2 py-1 rounded-full pointer-events-none z-50"
                style={{
                  left: `${hoverPosition}px`,
                  transform: "translateX(-50%)",
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
        </div>

        <span className="text-white font-mono text-sm min-w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* ✅ COMMENT AVATARS - HIDDEN DURING RANGE SELECTION */}
      {!isMobile &&
        (fileCategory === "video" || fileCategory === "audio") &&
        duration > 0 &&
        !isRangeSelectionMode &&
        comments.some(
          (comment) =>
            (comment.timestamp_seconds !== undefined &&
              comment.timestamp_seconds !== null &&
              comment.timestamp_seconds <= duration) ||
            (comment.timestamp_start_seconds !== undefined &&
              comment.timestamp_end_seconds !== undefined &&
              comment.timestamp_start_seconds <= duration)
        ) && (
          <div className="flex items-center gap-4">
            <div className="min-w-12"></div>
            <div className="flex-1 relative h-8">
              {/* Regular timestamp comments */}
              {comments
                .filter(
                  (comment) =>
                    comment.timestamp_seconds != null &&
                    comment.timestamp_seconds <= duration &&
                    comment.timestamp_start_seconds == null &&
                    comment.timestamp_end_seconds == null
                )
                .map((comment) => {
                  const position =
                    (comment.timestamp_seconds! / duration) * 100;
                  const isCurrentUser =
                    authenticatedUser?.id === comment.user_id;

                  const getAvatarUrl = () => {
                    if (
                      isCurrentUser &&
                      authenticatedUser?.avatar_url &&
                      !avatarError
                    ) {
                      return authenticatedUser.avatar_url;
                    }
                    if (comment.avatar_url && !avatarError) {
                      return comment.avatar_url;
                    }
                    return null;
                  };

                  const avatarUrl = getAvatarUrl();
                  const hasValidAvatar = !!avatarUrl;

                  return (
                    <div
                      key={comment.id}
                      className="absolute top-0 cursor-pointer hover:scale-110 transition-transform group"
                      style={{
                        left: `${position}%`,
                        transform: "translateX(-50%)",
                        zIndex: 10,
                      }}
                      onClick={() =>
                        onTimelineCommentClick(comment.timestamp_seconds!)
                      }
                    >
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-xs text-white font-medium border border-[#0070F3] shadow-lg overflow-hidden ${
                          hasValidAvatar
                            ? "p-0"
                            : "bg-gradient-to-br from-blue-600 to-cyan-400"
                        }`}
                      >
                        {hasValidAvatar ? (
                          <img
                            src={avatarUrl}
                            alt={`${comment.user_name}'s avatar`}
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          getInitials(comment.user_name)
                        )}
                      </div>
                      <div className="border-2 border-black/20 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#0070F3] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="font-medium">{comment.user_name}</div>
                        <div className="text-gray-300">
                          {formatTime(comment.timestamp_seconds!)}
                        </div>
                        <div className="max-w-48 truncate">
                          {comment.content}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                      </div>
                    </div>
                  );
                })}

              {/* Range comments avatars */}
              {comments
                .filter(
                  (comment) =>
                    comment.timestamp_start_seconds != null &&
                    comment.timestamp_end_seconds != null &&
                    comment.timestamp_start_seconds <= duration &&
                    comment.timestamp_seconds == null
                )
                .map((comment) => {
                  const startPosition =
                    (comment.timestamp_start_seconds! / duration) * 100;
                  const endPosition =
                    (comment.timestamp_end_seconds! / duration) * 100;
                  const width = endPosition - startPosition;

                  const isCurrentUser =
                    authenticatedUser?.id === comment.user_id;

                  const getAvatarUrl = () => {
                    if (
                      isCurrentUser &&
                      authenticatedUser?.avatar_url &&
                      !avatarError
                    ) {
                      return authenticatedUser.avatar_url;
                    }
                    if (comment.avatar_url && !avatarError) {
                      return comment.avatar_url;
                    }
                    return null;
                  };

                  const avatarUrl = getAvatarUrl();
                  const hasValidAvatar = !!avatarUrl;

                  return (
                    <div key={comment.id}>
                      {/* Range bar behind other elements */}
                      <div
                        className="absolute top-2 h-2 bg-yellow-500/30 border border-yellow-500/50 rounded-full"
                        style={{
                          left: `${startPosition}%`,
                          width: `${width}%`,
                          zIndex: 1,
                        }}
                      >
                        <div
                          className="absolute top-1/2 w-[5px] h-4 bg-yellow-500 rounded-full"
                          style={{
                            right: "-3px",
                            transform: "translateY(-50%)",
                          }}
                        />
                      </div>

                      {/* Range start avatar */}
                      <div
                        className="absolute top-0 cursor-pointer hover:scale-110 transition-transform group"
                        style={{
                          left: `${startPosition}%`,
                          transform: "translateX(-50%)",
                          zIndex: 10,
                        }}
                        onClick={() =>
                          onTimelineCommentClick(
                            comment.timestamp_start_seconds!
                          )
                        }
                      >
                        <div
                          className={`size-6 rounded-full flex items-center justify-center text-xs text-white font-medium border border-yellow-500 shadow-lg overflow-hidden ${
                            hasValidAvatar
                              ? "p-0"
                              : "bg-gradient-to-br from-yellow-600 to-amber-400"
                          }`}
                        >
                          {hasValidAvatar ? (
                            <img
                              src={avatarUrl}
                              alt={`${comment.user_name}'s avatar`}
                              className="w-full h-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            getInitials(comment.user_name)
                          )}
                        </div>
                        <div className="border-2 border-black/20 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#0070F3] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          <div className="font-medium">{comment.user_name}</div>
                          <div className="text-gray-300">
                            Range:{" "}
                            {formatTime(comment.timestamp_start_seconds!)} -{" "}
                            {formatTime(comment.timestamp_end_seconds!)}
                          </div>
                          <div className="max-w-48 truncate">
                            {comment.content}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-500"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Show confirmed pending range behind avatars */}
              {pendingRangeSelection && (
                <div
                  className="absolute top-2 h-2 bg-yellow-500/30 border border-yellow-500/50 rounded-full"
                  style={{
                    left: `${(pendingRangeSelection.startTime / duration) * 100}%`,
                    width: `${((pendingRangeSelection.endTime - pendingRangeSelection.startTime) / duration) * 100}%`,
                    zIndex: 1,
                  }}
                >
                  <div
                    className="absolute top-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full"
                    style={{
                      right: "-3px",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>
              )}
            </div>
            <div className="min-w-12"></div>
          </div>
        )}
    </div>
  );
};
