"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
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
import { Timeline } from "./Timeline";
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
  audioRef?: React.RefObject<HTMLAudioElement>;
  mediaType: "video" | "image" | "audio" | "document" | "svg";
  media?: any;
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
  // ✅ NEW: Range selection props
  onRangeSelect?: (startTime: number, endTime: number) => void;
  isRangeSelectionMode?: boolean;
  onRangeSelectionModeChange?: (mode: boolean) => void;
  // ✅ ADD: Missing props
  pendingRangeSelection?: { startTime: number; endTime: number } | null;
  onRangeSelectionComplete?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  videoRef,
  audioRef,
  mediaType,
  media,
  comments = [],
  onSeekToTimestamp,
  className = "",
  onTimeUpdate,
  fullscreenContainerRef,
  authenticatedUser,
  // ✅ NEW: Range selection props
  onRangeSelect,
  isRangeSelectionMode = false,
  onRangeSelectionModeChange,
  pendingRangeSelection,
  onRangeSelectionComplete,
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
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const volumeRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    const duration = mediaElement.duration || 0;
    const estimatedSize = duration * 1000000;

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
    if (fileCategory !== "video") return;

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

  // ✅ RESET STATES WHEN MEDIA CHANGES
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

  // ✅ MEDIA EVENT HANDLERS
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

  // ✅ PLAYBACK SPEED
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

  // ✅ CONTROL HANDLERS
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

  // ✅ PROGRESS BAR HANDLERS
  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      if (
        (fileCategory !== "video" && fileCategory !== "audio") ||
        !isMediaReady
      )
        return;

      const mediaElement = getMediaElement();
      if (!mediaElement || duration === 0) return;

      // We need to calculate position relative to the timeline element
      const timelineElement = document.querySelector(
        "[data-timeline-progress]"
      );
      if (!timelineElement) return;

      const rect = timelineElement.getBoundingClientRect();
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

  // ✅ NEW: Range selection handlers
  const handleRangeSelect = useCallback(
    (startTime: number, endTime: number) => {
      onRangeSelect?.(startTime, endTime);
      onRangeSelectionModeChange?.(false); // Exit range selection mode
    },
    [onRangeSelect, onRangeSelectionModeChange]
  );

  const handleRangeSelectionCancel = useCallback(() => {
    onRangeSelectionModeChange?.(false); // Exit range selection mode
  }, [onRangeSelectionModeChange]);

  // ✅ EARLY RETURN AFTER ALL HOOKS - ONLY SHOW FOR VIDEO AND AUDIO
  if (fileCategory !== "video" && fileCategory !== "audio") {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-4 video-controls ${className}`}
    >
      <div className="space-y-1">
        {/* ✅ TIMELINE COMPONENT */}
        <Timeline
          videoRef={videoRef}
          audioRef={audioRef}
          mediaType={mediaType}
          media={media}
          comments={comments}
          currentTime={currentTime}
          duration={duration}
          isMediaReady={isMediaReady}
          isMobile={isMobile}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onProgressInteraction={handleProgressInteraction}
          onTimelineCommentClick={handleTimelineCommentClick}
          authenticatedUser={authenticatedUser}
          formatTime={formatTime}
          getInitials={getInitials}
          // ✅ Range selection props
          isRangeSelectionMode={isRangeSelectionMode}
          onRangeSelect={handleRangeSelect}
          onRangeSelectionCancel={handleRangeSelectionCancel}
          pendingRangeSelection={pendingRangeSelection}
          // ✅ FIXED: Use the prop, not a non-existent function
          onRangeUnlock={onRangeSelectionComplete}
        />

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

          {/* ✅ SPEED CONTROL */}
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
