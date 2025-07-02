"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Volume2,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
} from "lucide-react";
import {
  BackwardIcon,
  ForwardIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { PauseIcon } from "@radix-ui/react-icons";

interface MediaComment {
  user_id?: string;
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
}

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaType: "video" | "image";
  comments?: MediaComment[];
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
  onTimeUpdate?: (time: number) => void;
  fullscreenContainerRef?: React.RefObject<HTMLDivElement>;
  authenticatedUser?: {
    // ✅ ADD THIS
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  videoRef,
  mediaType,
  comments = [],
  onSeekToTimestamp,
  className = "",
  onTimeUpdate,
  fullscreenContainerRef,
  authenticatedUser, // ✅ ADD THIS
}) => {
  // All hooks must be declared first, regardless of mediaType
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        const element =
          fullscreenContainerRef?.current ||
          videoRef.current?.parentElement ||
          document.documentElement;
        await element.requestFullscreen();
      } catch (error) {
        console.error("Failed to enter fullscreen:", error);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Failed to exit fullscreen:", error);
      }
    }
  }, [videoRef, fullscreenContainerRef]);

  // Format time helper
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get user initials for timeline avatars
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Reset states when mediaType changes or video source changes
  useEffect(() => {
    if (mediaType === "image") {
      setIsVideoReady(false);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setIsVideoReady(false);
      return;
    }

    // Reset state when video source changes
    setIsVideoReady(false);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);

    const checkVideoReady = () => {
      if (video.readyState >= 1) {
        setDuration(video.duration);
        setCurrentTime(video.currentTime);
        setIsPlaying(!video.paused);
        setIsVideoReady(true);
        video.volume = volume;
        video.muted = isMuted;
      }
    };

    checkVideoReady();

    const handleLoadedMetadata = () => {
      checkVideoReady();
    };

    const handleLoadStart = () => {
      setIsVideoReady(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadstart", handleLoadStart);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadstart", handleLoadStart);
    };
  }, [mediaType, videoRef, volume, isMuted]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType === "image" || !isVideoReady) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        const newTime = video.currentTime;
        setCurrentTime(newTime);
        onTimeUpdate?.(newTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("durationchange", handleDurationChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, [isDragging, onTimeUpdate, videoRef, mediaType, isVideoReady]);

  // Control handlers
  const handlePlayClick = useCallback(async () => {
    const video = videoRef.current;
    if (!video || mediaType === "image" || !isVideoReady) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error("Playback failed:", error);
      // Fallback for mobile: briefly show native controls
      if (isMobile) {
        video.controls = true;
        setTimeout(() => {
          video.controls = false;
        }, 1000);
      }
    }
  }, [isPlaying, videoRef, mediaType, isVideoReady, isMobile]);

  const skipTime = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video || mediaType === "image" || !isVideoReady) return;

      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      video.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    },
    [currentTime, duration, videoRef, mediaType, isVideoReady, onTimeUpdate]
  );

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Progress bar handlers
  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      if (mediaType === "image" || !isVideoReady) return;

      const video = videoRef.current;
      const progressElement = progressRef.current;
      if (!progressElement || !video || duration === 0) return;

      const rect = progressElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = pos * duration;

      video.currentTime = newTime;
      setCurrentTime(newTime);
      onSeekToTimestamp?.(newTime);
      onTimeUpdate?.(newTime);
    },
    [
      duration,
      videoRef,
      mediaType,
      isVideoReady,
      onSeekToTimestamp,
      onTimeUpdate,
    ]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      handleProgressInteraction(e.clientX);
    },
    [handleProgressInteraction]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mediaType === "image" || !isVideoReady) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      handleProgressClick(e);
    },
    [handleProgressClick, mediaType, isVideoReady]
  );

  // Touch handlers for progress bar
  const handleProgressTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (mediaType === "image" || !isVideoReady) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const touch = e.touches[0];
      handleProgressInteraction(touch.clientX);
    },
    [handleProgressInteraction, mediaType, isVideoReady]
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent) => {
      if (mediaType === "image" || !isVideoReady) return;

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
    [duration, mediaType, isVideoReady]
  );

  // Mouse and touch drag handlers
  useEffect(() => {
    if (mediaType === "image" || !isVideoReady) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleProgressInteraction(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        handleProgressInteraction(touch.clientX);
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleEnd);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleProgressInteraction, mediaType, isVideoReady]);

  // Volume handlers
  const toggleMute = useCallback(() => {
    if (mediaType === "image" || !isVideoReady) return;

    setIsMuted(!isMuted);
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
    }
  }, [isMuted, videoRef, mediaType, isVideoReady]);

  const handleVolumeInteraction = useCallback(
    (clientX: number) => {
      if (mediaType === "image" || !isVideoReady) return;

      const volumeElement = volumeRef.current;
      if (!volumeElement) return;

      const rect = volumeElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      setVolume(pos);
      setIsMuted(pos === 0);

      const video = videoRef.current;
      if (video) {
        video.volume = pos;
        video.muted = pos === 0;
      }
    },
    [mediaType, isVideoReady, videoRef]
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent) => {
      handleVolumeInteraction(e.clientX);
    },
    [handleVolumeInteraction]
  );

  const handleVolumeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (mediaType === "image" || !isVideoReady) return;
      e.preventDefault();

      const touch = e.touches[0];
      handleVolumeInteraction(touch.clientX);
    },
    [handleVolumeInteraction, mediaType, isVideoReady]
  );

  const handleTimelineCommentClick = (timestamp: number) => {
    const video = videoRef.current;
    if (!video || mediaType === "image" || !isVideoReady) return;

    video.currentTime = timestamp;
    setCurrentTime(timestamp);
    onSeekToTimestamp?.(timestamp);
    onTimeUpdate?.(timestamp);
  };

  // Early return AFTER all hooks are declared
  if (mediaType === "image") {
    return null;
  }

  // Show loading state if video isn't ready
  if (!isVideoReady) {
    return (
      <div
        className={`bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-4 ${className}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-mono text-sm min-w-12">0:00</span>
            <div className="flex-1 relative">
              <div className="h-2 bg-white/20 rounded-full relative">
                <div className="h-full bg-gray-500 rounded-full w-0" />
              </div>
            </div>
            <span className="text-white font-mono text-sm min-w-12">0:00</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <RevButtons variant="ghost" disabled className="text-gray-500 p-3">
              <SkipBack className="h-5 w-5" />
            </RevButtons>
            <RevButtons variant="ghost" disabled className="text-gray-500 p-4">
              <PlayIcon className="h-6 w-6" />
            </RevButtons>
            <RevButtons variant="ghost" disabled className="text-gray-500 p-3">
              <SkipForward className="h-5 w-5" />
            </RevButtons>
            <div className="flex items-center gap-2 ml-4">
              <RevButtons
                variant="ghost"
                disabled
                className="text-gray-500 p-3"
              >
                <Volume2 className="h-5 w-5" />
              </RevButtons>
              <input
                type="range"
                disabled
                className="w-20 h-1 bg-white/30 rounded-lg opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-4 video-controls ${className}`}
    >
      <div className="space-y-1">
        {/* Progress Bar with Playhead */}
        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm min-w-12">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 relative">
            <div
              ref={progressRef}
              className="h-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors relative"
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => {
                setHoverTime(null);
                setHoverPosition(null);
              }}
            >
              {/* Progress background */}
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Playhead - Always visible and draggable */}
              <div
                className={`absolute top-1/2 ${isMobile ? "w-3 h-5" : "w-2 h-4"} bg-white shadow-lg border border-blue-500 transition-transform hover:scale-110 pointer-events-none`}
                style={{
                  left: `${progressPercentage}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                  zIndex: 10,
                }}
              />
            </div>

            {/* Time tooltip */}
            {hoverTime !== null && hoverPosition !== null && !isMobile && (
              <div
                className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
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

        {/* Comment Avatars Below Timeline */}
        {!isMobile && // ✅ Only show on desktop
          duration > 0 &&
          comments.some(
            (comment) =>
              comment.timestamp_seconds !== undefined &&
              comment.timestamp_seconds !== null &&
              comment.timestamp_seconds <= duration
          ) && (
            <div className="flex items-center gap-4">
              <div className="min-w-12"></div>
              <div className="flex-1 relative h-8">
                {comments
                  .filter(
                    (comment) =>
                      comment.timestamp_seconds !== undefined &&
                      comment.timestamp_seconds !== null &&
                      comment.timestamp_seconds <= duration
                  )
                  .map((comment) => {
                    const position =
                      (comment.timestamp_seconds! / duration) * 100;

                    // Check if user is authenticated and has avatar
                    const isCurrentUser =
                      authenticatedUser?.id === comment.user_id;
                    const hasValidAvatar =
                      isCurrentUser &&
                      authenticatedUser?.avatar_url &&
                      !avatarError;

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
                          handleTimelineCommentClick(comment.timestamp_seconds!)
                        }
                      >
                        {/* Avatar container */}
                        <div
                          className={`size-6 rounded-[5px] flex items-center justify-center text-xs text-white font-medium border border-white shadow-lg overflow-hidden ${
                            hasValidAvatar
                              ? "p-0"
                              : "bg-gradient-to-br from-blue-600 to-cyan-400"
                          }`}
                        >
                          {hasValidAvatar ? (
                            <img
                              src={authenticatedUser.avatar_url}
                              alt={`${comment.user_name}'s avatar`}
                              className="w-full h-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            getInitials(comment.user_name)
                          )}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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
              </div>
              <div className="min-w-12"></div>
            </div>
          )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back */}
          <RevButtons
            variant="ghost"
            onClick={() => skipTime(-10)}
            className="text-white hover:bg-white/20 p-3"
          >
            <BackwardIcon className="h-5 w-5" />
          </RevButtons>

          {/* Play/Pause */}
          <RevButtons
            variant="ghost"
            onClick={handlePlayClick}
            className="text-white hover:bg-white/20 p-2"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon className="h-5 w-5" />}
          </RevButtons>

          {/* Skip Forward */}
          <RevButtons
            variant="ghost"
            onClick={() => skipTime(10)}
            className="text-white hover:bg-white/20 p-3"
          >
            <ForwardIcon className="h-5 w-5" />
          </RevButtons>

          {/* Volume Controls */}
          <div className="flex items-center gap-2 ml-4">
            {/* Mute Toggle Button */}
            <RevButtons
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20 p-3"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </RevButtons>

            {/* Custom Volume Slider */}
            <div
              ref={volumeRef}
              className={`relative ${isMobile ? "w-16 h-3" : "w-20 h-2"} bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors volume-slider`}
              onClick={handleVolumeClick}
              onTouchStart={handleVolumeTouchStart}
            >
              {/* Volume fill */}
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-150 pointer-events-none"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />

              {/* Volume handle */}
              <div
                className={`absolute top-1/2 ${isMobile ? "w-3 h-5" : "w-2 h-4"} bg-white shadow-lg border border-blue-500 transition-transform hover:scale-110 pointer-events-none`}
                style={{
                  left: `${(isMuted ? 0 : volume) * 100}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                  zIndex: 20,
                }}
              />
            </div>

            {/* Fullscreen */}
            <RevButtons
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 p-3"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </RevButtons>
          </div>
        </div>
      </div>
    </div>
  );
};