"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

import {
  Volume2,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  BackwardIcon,
  ForwardIcon,
  InformationCircleIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PauseIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";

// ✅ ADD FILE CATEGORY HELPER
const getFileCategory = (fileType: string, mimeType: string) => {
  if (fileType === "video") return "video";
  if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType === "text/plain"
  )
    return "document";
  return "unknown";
};

interface MediaComment {
  user_id?: string;
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  avatar_url?: string;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface PlayerControlsProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  audioRef?: React.RefObject<HTMLAudioElement>; // ✅ ADD AUDIO REF
  mediaType: "video" | "image" | "audio" | "document" | "svg";
  media?: any; // ✅ ADD MEDIA OBJECT
  comments?: MediaComment[];
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
  onTimeUpdate?: (time: number) => void;
  fullscreenContainerRef?: React.RefObject<HTMLDivElement>;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  videoRef,
  audioRef, // ✅ ADD AUDIO REF
  mediaType,
  media,
  comments = [],
  onSeekToTimestamp,
  className = "",
  onTimeUpdate,
  fullscreenContainerRef,
  authenticatedUser,
}) => {
  // ✅ DETERMINE FILE CATEGORY
  const fileCategory = media
    ? getFileCategory(media.file_type, media.mime_type)
    : mediaType;

  // All hooks must be declared first, regardless of fileCategory
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false); // ✅ RENAMED FROM isVideoReady
  const [isMobile, setIsMobile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // ✅ GET CURRENT MEDIA ELEMENT (VIDEO OR AUDIO)
  const getMediaElement = () => {
    if (fileCategory === "video") return videoRef?.current;
    if (fileCategory === "audio") return audioRef?.current;
    return null;
  };

  // ✅ ADD MEDIA INFO FUNCTION FOR BOTH VIDEO AND AUDIO
  const getMediaInfo = () => {
    const mediaElement = getMediaElement();
    if (!mediaElement || !isMediaReady) return null;

    let width = 0;
    let height = 0;

    if (fileCategory === "video" && videoRef?.current) {
      width = videoRef.current.videoWidth;
      height = videoRef.current.videoHeight;
    }

    // Simple file size estimate (this is approximate)
    const duration = mediaElement.duration || 0;
    const estimatedSize = duration * 1000000; // Rough estimate

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "Unknown";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    return {
      resolution: fileCategory === "video" ? `${width}×${height}` : "Audio",
      fileSize: formatFileSize(estimatedSize),
      type: fileCategory === "video" ? "Video" : "Audio",
    };
  };

  const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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

  // ✅ FULLSCREEN HANDLERS - ONLY FOR VIDEO
  const toggleFullscreen = useCallback(async () => {
    if (fileCategory !== "video") return; // ✅ ONLY VIDEO SUPPORTS FULLSCREEN

    if (!document.fullscreenElement) {
      try {
        const element =
          fullscreenContainerRef?.current ||
          videoRef?.current?.parentElement ||
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
  }, [fileCategory, videoRef, fullscreenContainerRef]);

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

  // ✅ RESET STATES WHEN MEDIA CHANGES - HANDLE BOTH VIDEO AND AUDIO
  useEffect(() => {
    if (fileCategory !== "video" && fileCategory !== "audio") {
      setIsMediaReady(false);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setPlaybackSpeed(1);
      return;
    }

    const mediaElement = getMediaElement();
    if (!mediaElement) {
      setIsMediaReady(false);
      return;
    }

    // Reset state when media source changes
    setIsMediaReady(false);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setPlaybackSpeed(1);

    const checkMediaReady = () => {
      if (mediaElement.readyState >= 1) {
        setDuration(mediaElement.duration);
        setCurrentTime(mediaElement.currentTime);
        setIsPlaying(!mediaElement.paused);
        setIsMediaReady(true);
        mediaElement.volume = volume;
        mediaElement.muted = isMuted;
      }
    };

    checkMediaReady();

    const handleLoadedMetadata = () => {
      checkMediaReady();
    };

    const handleLoadStart = () => {
      setIsMediaReady(false);
    };

    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("loadstart", handleLoadStart);

    return () => {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("loadstart", handleLoadStart);
    };
  }, [fileCategory, videoRef, audioRef, volume, isMuted]);

  // ✅ MEDIA EVENT HANDLERS - HANDLE BOTH VIDEO AND AUDIO
  useEffect(() => {
    const mediaElement = getMediaElement();
    if (
      !mediaElement ||
      (fileCategory !== "video" && fileCategory !== "audio") ||
      !isMediaReady
    )
      return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        const newTime = mediaElement.currentTime;
        setCurrentTime(newTime);
        onTimeUpdate?.(newTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleDurationChange = () => setDuration(mediaElement.duration);

    mediaElement.addEventListener("timeupdate", handleTimeUpdate);
    mediaElement.addEventListener("play", handlePlay);
    mediaElement.addEventListener("pause", handlePause);
    mediaElement.addEventListener("ended", handleEnded);
    mediaElement.addEventListener("durationchange", handleDurationChange);

    return () => {
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
      mediaElement.removeEventListener("play", handlePlay);
      mediaElement.removeEventListener("pause", handlePause);
      mediaElement.removeEventListener("ended", handleEnded);
      mediaElement.removeEventListener("durationchange", handleDurationChange);
    };
  }, [
    isDragging,
    onTimeUpdate,
    fileCategory,
    videoRef,
    audioRef,
    isMediaReady,
  ]);

  // ✅ PLAYBACK SPEED - HANDLE BOTH VIDEO AND AUDIO
  useEffect(() => {
    const mediaElement = getMediaElement();
    if (
      mediaElement &&
      (fileCategory === "video" || fileCategory === "audio") &&
      isMediaReady
    ) {
      mediaElement.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, fileCategory, videoRef, audioRef, isMediaReady]);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      const mediaElement = getMediaElement();
      if (
        mediaElement &&
        (fileCategory === "video" || fileCategory === "audio") &&
        isMediaReady
      ) {
        mediaElement.playbackRate = speed;
      }
    },
    [fileCategory, videoRef, audioRef, isMediaReady]
  );

  // ✅ CONTROL HANDLERS - HANDLE BOTH VIDEO AND AUDIO
  const handlePlayClick = useCallback(async () => {
    const mediaElement = getMediaElement();
    if (
      !mediaElement ||
      (fileCategory !== "video" && fileCategory !== "audio") ||
      !isMediaReady
    )
      return;

    try {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        await mediaElement.play();
      }
    } catch (error) {
      console.error("Playback failed:", error);
      // Fallback for mobile: briefly show native controls
      if (isMobile && "controls" in mediaElement) {
        (mediaElement as any).controls = true;
        setTimeout(() => {
          (mediaElement as any).controls = false;
        }, 1000);
      }
    }
  }, [isPlaying, fileCategory, videoRef, audioRef, isMediaReady, isMobile]);

  const skipTime = useCallback(
    (seconds: number) => {
      const mediaElement = getMediaElement();
      if (
        !mediaElement ||
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;

      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      mediaElement.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    },
    [
      currentTime,
      duration,
      fileCategory,
      videoRef,
      audioRef,
      isMediaReady,
      onTimeUpdate,
    ]
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

  // ✅ PROGRESS BAR HANDLERS - HANDLE BOTH VIDEO AND AUDIO
  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;

      const mediaElement = getMediaElement();
      const progressElement = progressRef.current;
      if (!progressElement || !mediaElement || duration === 0) return;

      const rect = progressElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = pos * duration;

      mediaElement.currentTime = newTime;
      setCurrentTime(newTime);
      onSeekToTimestamp?.(newTime);
      onTimeUpdate?.(newTime);
    },
    [
      duration,
      fileCategory,
      videoRef,
      audioRef,
      isMediaReady,
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
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      handleProgressClick(e);
    },
    [handleProgressClick, fileCategory, isMediaReady]
  );

  // Touch handlers for progress bar
  const handleProgressTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const touch = e.touches[0];
      handleProgressInteraction(touch.clientX);
    },
    [handleProgressInteraction, fileCategory, isMediaReady]
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;

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
    [duration, fileCategory, isMediaReady]
  );

  const handleVolumeInteraction = useCallback(
    (clientX: number) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;

      const volumeElement = volumeRef.current;
      if (!volumeElement) return;

      const rect = volumeElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      setVolume(pos);
      setIsMuted(pos === 0);

      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.volume = pos;
        mediaElement.muted = pos === 0;
      }
    },
    [fileCategory, isMediaReady, videoRef, audioRef]
  );

  useEffect(() => {
    if ((fileCategory !== "video" && fileCategory !== "audio") || !isMediaReady)
      return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isVolumeDragging) {
        handleVolumeInteraction(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isVolumeDragging && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        handleVolumeInteraction(touch.clientX);
      }
    };

    const handleEnd = () => {
      if (isVolumeDragging) {
        setIsVolumeDragging(false);
      }
    };

    if (isVolumeDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isVolumeDragging, handleVolumeInteraction, fileCategory, isMediaReady]);

  // Mouse and touch drag handlers
  useEffect(() => {
    if ((fileCategory !== "video" && fileCategory !== "audio") || !isMediaReady)
      return;

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
  }, [isDragging, handleProgressInteraction, fileCategory, isMediaReady]);

  // Volume handlers
  const toggleMute = useCallback(() => {
    if ((fileCategory !== "video" && fileCategory !== "audio") || !isMediaReady)
      return;

    setIsMuted(!isMuted);
    const mediaElement = getMediaElement();
    if (mediaElement) {
      mediaElement.muted = !isMuted;
    }
  }, [isMuted, fileCategory, videoRef, audioRef, isMediaReady]);

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent) => {
      handleVolumeInteraction(e.clientX);
    },
    [handleVolumeInteraction]
  );

  const handleVolumeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;
      e.preventDefault();

      const touch = e.touches[0];
      handleVolumeInteraction(touch.clientX);
    },
    [handleVolumeInteraction, fileCategory, isMediaReady]
  );

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setIsVolumeDragging(true);
      handleVolumeClick(e);
    },
    [handleVolumeClick, fileCategory, isMediaReady]
  );

  const handleTimelineCommentClick = (timestamp: number) => {
    const mediaElement = getMediaElement();
    if (
      !mediaElement ||
      (fileCategory !== "video" && fileCategory !== "audio") ||
      !isMediaReady
    )
      return;

    mediaElement.currentTime = timestamp;
    setCurrentTime(timestamp);
    onSeekToTimestamp?.(timestamp);
    onTimeUpdate?.(timestamp);
  };

  // ✅ EARLY RETURN AFTER ALL HOOKS - ONLY SHOW FOR VIDEO AND AUDIO
  if (fileCategory !== "video" && fileCategory !== "audio") {
    return null;
  }

  // Show loading state if media isn't ready
  if (!isMediaReady) {
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
            <Button variant="ghost" disabled size={"icon"}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size={"icon"}>
              <PlayIcon className="h-6 w-6" />
            </Button>
            <Button variant="ghost" disabled size={"icon"}>
              <SkipForward className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" disabled size={"icon"}>
                <Volume2 className="h-5 w-5" />
              </Button>
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

        {/* ✅ COMMENT AVATARS BELOW TIMELINE - ONLY FOR VIDEO (audio doesn't have visual comments) */}
        {!isMobile &&
          fileCategory === "video" && // ✅ ONLY VIDEO
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

                    // ✅ UPDATED AVATAR LOGIC: Use the new avatar_url field
                    const isCurrentUser =
                      authenticatedUser?.id === comment.user_id;

                    // Get avatar URL from the stored field
                    const getAvatarUrl = () => {
                      // If this is the current user, prefer their live avatar
                      if (
                        isCurrentUser &&
                        authenticatedUser?.avatar_url &&
                        !avatarError
                      ) {
                        return authenticatedUser.avatar_url;
                      }

                      // Otherwise, use the stored avatar from when the comment was created
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
                          handleTimelineCommentClick(comment.timestamp_seconds!)
                        }
                      >
                        {/* Avatar container */}
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
                        {/* Tooltip */}
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
              </div>
              <div className="min-w-12"></div>
            </div>
          )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back */}
          <Button
            variant="not"
            className="bg-none hover:bg-none hover:text-[#0070F3]"
            onClick={() => skipTime(-10)}
            size={"icon"}
          >
            <BackwardIcon className="h-5 w-5 " />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="not"
            className="bg-none hover:bg-none hover:text-[#0070F3]"
            onClick={handlePlayClick}
            size={"icon"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon className="h-5 w-5" />}
          </Button>

          {/* Skip Forward */}
          <Button
            variant="not"
            className="bg-none hover:bg-none hover:text-[#0070F3]"
            onClick={() => skipTime(10)}
            size={"icon"}
          >
            <ForwardIcon className="h-5 w-5" />
          </Button>

          {/* ✅ SPEED CONTROL - FOR BOTH VIDEO AND AUDIO */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="not"
                className="bg-none hover:bg-none hover:text-[#0070F3]"
                size="icon"
              >
                <span className="text-xs font-mono text-white/70 hover:text-white transition-colors">
                  {playbackSpeed}×
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28 ">
              <div className="p-1">
                <div className="text-xs text-muted-foreground mb-1">Speed</div>
                {SPEED_OPTIONS.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`
             text-sm cursor-pointer px-2 py-1
             ${playbackSpeed === speed ? "bg-blue-500 text-white" : ""}
           `}
                  >
                    {speed}×
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Volume Controls */}
          <div className="flex items-center gap-2 ">
            {/* Mute Toggle Button */}
            <Button
              variant="not"
              className="bg-none hover:bg-none hover:text-[#0070F3]"
              onClick={toggleMute}
              size={"icon"}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </Button>

            {/* Custom Volume Slider */}
            <div
              ref={volumeRef}
              className={`relative ${isMobile ? "w-16 h-3" : "w-20 h-2"} bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors volume-slider`}
              onClick={handleVolumeClick}
              onMouseDown={handleVolumeMouseDown}
              onTouchStart={handleVolumeTouchStart}
            >
              {/* Volume fill */}
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-150 "
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />

              {/* Volume handle */}
              <div
                className={`absolute top-1/2 ${isMobile ? "w-3 h-5" : "w-2 h-4"} bg-white shadow-lg border border-blue-500 transition-transform hover:scale-110  `}
                style={{
                  left: `${(isMuted ? 0 : volume) * 100}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                  zIndex: 20,
                }}
              />
            </div>

            {/* Settings & Fullscreen */}
            <div className="flex items-center gap-2 ml-2">
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="not"
                    className="bg-none hover:bg-none hover:text-[#0070F3]"
                    size={"icon"}
                  >
                    <InformationCircleIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(() => {
                    const mediaInfo = getMediaInfo();
                    return mediaInfo ? (
                      <>
                        <DropdownMenuItem
                          disabled
                          className="flex justify-between"
                        >
                          <span className="text-muted-foreground">Type:</span>
                          <span>{mediaInfo.type}</span>
                        </DropdownMenuItem>
                        {fileCategory === "video" && (
                          <DropdownMenuItem
                            disabled
                            className="flex justify-between"
                          >
                            <span className="text-muted-foreground">
                              Quality:
                            </span>
                            <span>{mediaInfo.resolution}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          disabled
                          className="flex justify-between"
                        >
                          <span className="text-muted-foreground">
                            File Size:
                          </span>
                          <span>{mediaInfo.fileSize}</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem disabled>
                        No media information available
                      </DropdownMenuItem>
                    );
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* ✅ FULLSCREEN - ONLY FOR VIDEO */}
              {fileCategory === "video" && (
                <Button
                  variant="not"
                  className="bg-none hover:bg-none hover:text-[#0070F3]"
                  onClick={toggleFullscreen}
                  size={"icon"}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
