// app/media/full-size/[id]/FullsizeVideoViewer.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlayerControls } from "@/app/review/[token]/components/PlayerControls";
import { ClickAnimation } from "@/app/review/[token]/lib/ClickAnimation";
import {
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
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

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image" | "audio" | "document"; // ✅ EXPAND TYPES
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
  const [showClickAnimation, setShowClickAnimation] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ GET FILE CATEGORY
  const fileCategory = getFileCategory(
    mediaFile.file_type,
    mediaFile.mime_type
  );
  const hasPlayerControls =
    fileCategory === "video" || fileCategory === "audio";

  // ✅ PREVENT RIGHT-CLICK CONTEXT MENU IF DOWNLOADS DISABLED
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };

  // ✅ PREVENT DRAG IF DOWNLOADS DISABLED
  const handleDragStart = (e: React.DragEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };

  // ✅ GET CURRENT MEDIA ELEMENT
  const getMediaElement = () => {
    if (fileCategory === "video") return videoRef.current;
    if (fileCategory === "audio") return audioRef.current;
    return null;
  };

  // ✅ MEDIA READY STATE MANAGEMENT - HANDLES BOTH VIDEO AND AUDIO
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

  // Auto-hide controls logic - ✅ ONLY FOR VIDEO/AUDIO
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

  // ✅ VIDEO CLICK HANDLER - ONLY FOR VIDEO
  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (video && fileCategory === "video" && isMediaReady) {
      if (video.paused) {
        video.play().catch(console.error);
        setShowClickAnimation(true);
      } else {
        video.pause();
        setShowClickAnimation(true);
      }
    }
    if (hasPlayerControls) {
      resetControlsTimeout();
    }
  }, [fileCategory, isMediaReady, resetControlsTimeout, hasPlayerControls]);

  // Add animation complete handler
  const handleAnimationComplete = useCallback(() => {
    setShowClickAnimation(false);
  }, []);

  // ✅ TIME UPDATE HANDLER - FOR BOTH VIDEO AND AUDIO
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // ✅ SEEK TO TIMESTAMP HANDLER - FOR BOTH VIDEO AND AUDIO
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

  // ✅ PLAY/PAUSE STATE TRACKING - FOR BOTH VIDEO AND AUDIO
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

  // ✅ CONTROLS VISIBILITY - FOR BOTH VIDEO AND AUDIO
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

  // ✅ DISABLE BROWSER SHORTCUTS THAT ALLOW SAVING IF DOWNLOADS DISABLED
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

  // ✅ RENDER MEDIA CONTENT BASED ON FILE CATEGORY - MATCHING MediaDisplay
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
            <ClickAnimation
              show={showClickAnimation}
              isPlaying={videoPlaying}
              onAnimationComplete={handleAnimationComplete}
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
      {/* ✅ DOWNLOAD RESTRICTION OVERLAY */}
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

      {/* ✅ CONTROLS OVERLAY - FOR VIDEO AND AUDIO */}
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

      {/* ✅ LOADING STATE - FOR VIDEO AND AUDIO */}
      {hasPlayerControls && !isMediaReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Loading {fileCategory}...</div>
        </div>
      )}
    </div>
  );
}
