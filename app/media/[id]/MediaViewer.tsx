// app/media/full-size/[id]/FullsizeVideoViewer.tsx
// @ts-nocheck

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlayerControls } from "@/app/review/[token]/components/Timeline/PlayerControls";
import { ClickAnimation } from "@/app/review/[token]/components/Display/ClickAnimation";
import {
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { getFileCategory } from "@/app/dashboard/utilities";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image" | "audio" | "document";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
  project_id: string;
}

interface MediaViewerProps {
  mediaFile: MediaFile;
  allowDownload?: boolean;
}

export function MediaViewer({
  mediaFile,
  allowDownload = false,
}: MediaViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMediaReady, setIsMediaReady] = useState(false);

  // Animation states for all three types
  const [showPlayPauseAnimation, setShowPlayPauseAnimation] = useState(false);
  const [showBackwardAnimation, setShowBackwardAnimation] = useState(false);
  const [showForwardAnimation, setShowForwardAnimation] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Double click detection
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [clickCount, setClickCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileCategory = getFileCategory(
    mediaFile.file_type,
    mediaFile.mime_type
  );
  const hasPlayerControls =
    fileCategory === "video" || fileCategory === "audio";

  // Prevent right-click context menu if downloads disabled
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };

  // Prevent drag if downloads disabled
  const handleDragStart = (e: React.DragEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };

  // Get current media element
  const getMediaElement = () => {
    if (fileCategory === "video") return videoRef.current;
    if (fileCategory === "audio") return audioRef.current;
    return null;
  };

  // Handle video seeking
  const seekVideo = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (video && fileCategory === "video") {
        const newTime = Math.max(
          0,
          Math.min(video.duration, video.currentTime + seconds)
        );
        video.currentTime = newTime;
      }
    },
    [fileCategory]
  );

  // Handle video clicks with position detection - ONLY FOR VIDEO
  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      const video = videoRef.current;
      if (!video || fileCategory !== "video" || !isMediaReady) return;

      // Get click position relative to video element
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const videoWidth = rect.width;

      // Divide video into three zones: left (0-33%), center (33-67%), right (67-100%)
      const leftZone = videoWidth * 0.33;
      const rightZone = videoWidth * 0.67;

      let clickZone: "left" | "center" | "right";
      if (clickX < leftZone) {
        clickZone = "left";
      } else if (clickX > rightZone) {
        clickZone = "right";
      } else {
        clickZone = "center";
      }

      // Handle click counting for double-click detection
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);

      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      if (newClickCount === 1) {
        // Single click - only for center zone (play/pause)
        if (clickZone === "center") {
          const timeout = setTimeout(() => {
            // Single click confirmed for center
            if (video.paused) {
              video.play().catch(console.error);
            } else {
              video.pause();
            }
            setShowPlayPauseAnimation(true);
            setClickCount(0);
          }, 250); // Wait 250ms to see if there's a second click
          setClickTimeout(timeout);
        } else {
          // For left/right zones, wait for potential double click
          const timeout = setTimeout(() => {
            // Single click in left/right zone - do nothing
            setClickCount(0);
          }, 250);
          setClickTimeout(timeout);
        }
      } else if (newClickCount === 2) {
        // Double click confirmed
        clearTimeout(clickTimeout);
        setClickTimeout(null);

        if (clickZone === "left") {
          // Double click left - seek backward 5 seconds
          seekVideo(-5);
          setShowBackwardAnimation(true);
        } else if (clickZone === "right") {
          // Double click right - seek forward 5 seconds
          seekVideo(5);
          setShowForwardAnimation(true);
        } else {
          // Double click center - toggle play/pause
          if (video.paused) {
            video.play().catch(console.error);
          } else {
            video.pause();
          }
          setShowPlayPauseAnimation(true);
        }
        setClickCount(0);
      }

      // Reset controls timeout
      if (hasPlayerControls) {
        resetControlsTimeout();
      }
    },
    [
      fileCategory,
      isMediaReady,
      clickCount,
      clickTimeout,
      seekVideo,
      hasPlayerControls,
    ]
  );

  // Animation complete handlers
  const handlePlayPauseAnimationComplete = useCallback(() => {
    setShowPlayPauseAnimation(false);
  }, []);

  const handleBackwardAnimationComplete = useCallback(() => {
    setShowBackwardAnimation(false);
  }, []);

  const handleForwardAnimationComplete = useCallback(() => {
    setShowForwardAnimation(false);
  }, []);

  // Media ready state management - handles both video and audio
  useEffect(() => {
    if (!hasPlayerControls) {
      setIsMediaReady(false);
      return;
    }

    const mediaElement = getMediaElement();
    if (!mediaElement) {
      setIsMediaReady(false);
      return;
    }

    // Reset state when media source changes
    setIsMediaReady(false);
    setCurrentTime(0);

    const checkMediaReady = () => {
      if (mediaElement.readyState >= 1) {
        setCurrentTime(mediaElement.currentTime);
        setIsMediaReady(true);
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
  }, [fileCategory, mediaFile.r2_url, hasPlayerControls]);

  // Auto-hide controls logic - only for video/audio
  const resetControlsTimeout = useCallback(() => {
    if (!hasPlayerControls) return;

    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      const mediaElement = getMediaElement();
      if (mediaElement && !mediaElement.paused && isMediaReady) {
        setShowControls(false);
      }
    }, 3000);
  }, [isMediaReady, hasPlayerControls]);

  const handleMouseMove = useCallback(() => {
    if (hasPlayerControls) {
      resetControlsTimeout();
    }
  }, [resetControlsTimeout, hasPlayerControls]);

  // Time update handler - for both video and audio
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Seek to timestamp handler - for both video and audio
  const handleSeekToTimestamp = useCallback(
    (timestamp: number) => {
      if (!isMediaReady) return;

      if (fileCategory === "video" && videoRef.current) {
        videoRef.current.currentTime = timestamp;
      } else if (fileCategory === "audio" && audioRef.current) {
        audioRef.current.currentTime = timestamp;
      }
    },
    [fileCategory, isMediaReady]
  );

  // Play/pause state tracking - for both video and audio
  useEffect(() => {
    const mediaElement = getMediaElement();
    if (!mediaElement || !hasPlayerControls) return;

    const handlePlay = () => setVideoPlaying(true);
    const handlePause = () => setVideoPlaying(false);

    mediaElement.addEventListener("play", handlePlay);
    mediaElement.addEventListener("pause", handlePause);

    return () => {
      mediaElement.removeEventListener("play", handlePlay);
      mediaElement.removeEventListener("pause", handlePause);
    };
  }, [fileCategory, hasPlayerControls]);

  // Controls visibility - for both video and audio
  useEffect(() => {
    const mediaElement = getMediaElement();
    if (!mediaElement || !hasPlayerControls || !isMediaReady) return;

    const handlePlay = () => resetControlsTimeout();
    const handlePause = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };

    mediaElement.addEventListener("play", handlePlay);
    mediaElement.addEventListener("pause", handlePause);

    return () => {
      mediaElement.removeEventListener("play", handlePlay);
      mediaElement.removeEventListener("pause", handlePause);
    };
  }, [resetControlsTimeout, hasPlayerControls, isMediaReady]);

  // Disable browser shortcuts that allow saving if downloads disabled
  useEffect(() => {
    if (!allowDownload) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable Ctrl+S (Save as)
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          return false;
        }
        // Disable F12 (DevTools) - though this can be bypassed
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }
        // Disable Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === "u") {
          e.preventDefault();
          return false;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [allowDownload]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Render media content based on file category
  const renderMediaContent = () => {
    switch (fileCategory) {
      case "video":
        return (
          <>
            <video
              ref={videoRef}
              src={mediaFile.r2_url}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={handleVideoClick}
              playsInline
              preload="metadata"
              controls={false}
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
              controlsList={
                !allowDownload
                  ? "nodownload nofullscreen noremoteplayback"
                  : undefined
              }
              style={{
                userSelect: allowDownload ? "auto" : "none",
              }}
            />

            {/* All three click animations for video */}
            <ClickAnimation
              show={showPlayPauseAnimation}
              isPlaying={videoPlaying}
              animationType="play-pause"
              position="center"
              onAnimationComplete={handlePlayPauseAnimationComplete}
            />

            <ClickAnimation
              show={showBackwardAnimation}
              animationType="backward"
              position="left"
              onAnimationComplete={handleBackwardAnimationComplete}
            />

            <ClickAnimation
              show={showForwardAnimation}
              animationType="forward"
              position="right"
              onAnimationComplete={handleForwardAnimationComplete}
            />
          </>
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-purple-600 to-blue-800 p-8">
            <MusicalNoteIcon className="h-32 w-32 text-white/80 mb-8" />

            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={mediaFile.r2_url}
              preload="metadata"
              style={{ display: "none" }}
              onContextMenu={handleContextMenu}
              controlsList={!allowDownload ? "nodownload" : undefined}
            />

            <div className="text-center">
              <h3 className="text-white/90 text-2xl font-medium mb-4">
                {mediaFile.original_filename}
              </h3>
              <p className="text-white/60 text-lg">Audio File</p>
            </div>
          </div>
        );

      case "image":
        return (
          <img
            src={mediaFile.r2_url}
            alt={mediaFile.original_filename}
            className="max-w-full max-h-full object-contain"
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            draggable={allowDownload}
            style={{
              userSelect: allowDownload ? "auto" : "none",
            }}
          />
        );

      case "svg":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-green-800 to-teal-900 p-8">
            <CodeBracketIcon className="h-32 w-32 text-white/80 mb-8" />
            <div className="text-center">
              <h3 className="text-white/90 text-2xl font-medium mb-4">
                SVG Vector File
              </h3>
              <p className="text-white/60 text-lg mb-4">
                {mediaFile.original_filename}
              </p>
              <Button
                onClick={() => window.open(mediaFile.r2_url, "_blank")}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                View SVG
              </Button>
            </div>
          </div>
        );

      case "document":
        if (mediaFile.mime_type === "application/pdf") {
          return (
            <div className="w-full h-full">
              <iframe
                src={`${mediaFile.r2_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={mediaFile.original_filename}
                onContextMenu={handleContextMenu}
              />
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-700 to-gray-900 p-8">
              <DocumentIcon className="h-32 w-32 text-white/80 mb-8" />
              <div className="text-center">
                <h3 className="text-white/90 text-2xl font-medium mb-4">
                  Document File
                </h3>
                <p className="text-white/60 text-lg mb-6">
                  {mediaFile.original_filename}
                </p>
                <Button
                  onClick={() => window.open(mediaFile.r2_url, "_blank")}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  Open Document
                </Button>
              </div>
            </div>
          );
        }

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800 p-8">
            <DocumentIcon className="h-32 w-32 text-white/80 mb-8" />
            <div className="text-center">
              <h3 className="text-white/90 text-2xl font-medium mb-4">
                Unsupported File Type
              </h3>
              <p className="text-white/60 text-lg">
                {mediaFile.original_filename}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={fullscreenContainerRef}
      className="min-h-dvh bg-black relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Download restriction overlay */}
      {!allowDownload && (
        <div
          className="absolute inset-0 z-40 pointer-events-none"
          style={{
            background: "transparent",
            userSelect: "none",
          }}
        />
      )}

      {/* Media Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {renderMediaContent()}
      </div>

      {/* Controls overlay - for video and audio */}
      {hasPlayerControls && (
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <PlayerControls
            videoRef={videoRef}
            audioRef={audioRef}
            mediaType={mediaFile.file_type}
            media={mediaFile}
            comments={[]}
            onSeekToTimestamp={handleSeekToTimestamp}
            onTimeUpdate={handleTimeUpdate}
            fullscreenContainerRef={fullscreenContainerRef}
            authenticatedUser={null}
          />
        </div>
      )}

      {/* Top overlay with back button */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls || !hasPlayerControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-white text-lg">
              {mediaFile.original_filename}
            </div>
          </div>
        </div>
      </div>

      {/* Loading state - for video and audio */}
      {hasPlayerControls && !isMediaReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Loading {fileCategory}...</div>
        </div>
      )}
    </div>
  );
}