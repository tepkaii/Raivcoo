"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
  Maximize,
} from "lucide-react";

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
}

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaType: "video" | "image";
  comments?: MediaComment[];
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  videoRef,
  mediaType,
  comments = [],
  onSeekToTimestamp,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const progressRef = useRef<HTMLDivElement>(null);

  // Don't show controls for images
  if (mediaType === "image") {
    return null;
  }

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

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
        onSeekToTimestamp?.(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      video.muted = isMuted;
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isDragging, volume, isMuted, onSeekToTimestamp, videoRef]);

  // Control handlers
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  }, [isPlaying, videoRef]);

  const skipTime = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [currentTime, duration, videoRef]
  );

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }
  };

  // Progress bar handlers
  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);

      const video = videoRef.current;
      const progressElement = progressRef.current;

      if (!progressElement || !video || duration === 0) return;

      const rect = progressElement.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const newTime = pos * duration;

      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration, videoRef]
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent) => {
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
    [duration]
  );

  // Timeline comment click handler
  const handleTimelineCommentClick = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = timestamp;
    setCurrentTime(timestamp);
    onSeekToTimestamp?.(timestamp);
  };

  // Mouse drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const video = videoRef.current;
        const progressElement = progressRef.current;
        if (!progressElement || !video || duration === 0) return;

        const rect = progressElement.getBoundingClientRect();
        const pos = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        const newTime = pos * duration;

        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, duration, videoRef]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-4 ${className}`}
    >
      <div className="space-y-4">
        {/* Progress Bar with Timeline Comments */}
        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm min-w-12">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 relative">
            <div
              ref={progressRef}
              className="h-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors relative"
              onMouseDown={handleProgressMouseDown}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => {
                setHoverTime(null);
                setHoverPosition(null);
              }}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Progress handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                style={{
                  left: `${progressPercentage}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                }}
              />

              {/* Timeline Comment Avatars */}
              {comments
                .filter(
                  (comment) =>
                    comment.timestamp_seconds !== undefined &&
                    comment.timestamp_seconds !== null
                )
                .map((comment) => {
                  const position =
                    (comment.timestamp_seconds! / duration) * 100;

                  return (
                    <div
                      key={comment.id}
                      className="absolute top-1/2 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${position}%`,
                        transform: "translateX(-50%) translateY(-50%)",
                        zIndex: 10,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimelineCommentClick(comment.timestamp_seconds!);
                      }}
                      title={`${comment.user_name}: ${comment.content} (${formatTime(comment.timestamp_seconds!)})`}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-xs text-white font-medium border-2 border-white">
                        {getInitials(comment.user_name)}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Time tooltip */}
            {hoverTime !== null && hoverPosition !== null && (
              <div
                className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-30"
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

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back */}
          <RevButtons
            variant="ghost"
            onClick={() => skipTime(-10)}
            className="text-white hover:bg-white/20 p-3"
          >
            <SkipBack className="h-5 w-5" />
          </RevButtons>

          {/* Play/Pause */}
          <RevButtons
            variant="ghost"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 p-4"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </RevButtons>

          {/* Skip Forward */}
          <RevButtons
            variant="ghost"
            onClick={() => skipTime(10)}
            className="text-white hover:bg-white/20 p-3"
          >
            <SkipForward className="h-5 w-5" />
          </RevButtons>

          {/* Volume controls */}
          <div className="flex items-center gap-2 ml-4">
            <RevButtons
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20 p-3"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </RevButtons>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/30 rounded-lg"
            />
          </div>

          {/* Settings */}
          <div className="flex items-center gap-2 ml-4">
            <RevButtons
              variant="ghost"
              className="text-white hover:bg-white/20 p-3"
            >
              <Settings className="h-5 w-5" />
            </RevButtons>

            <RevButtons
              variant="ghost"
              className="text-white hover:bg-white/20 p-3"
            >
              <Maximize className="h-5 w-5" />
            </RevButtons>
          </div>
        </div>
      </div>
    </div>
  );
};
