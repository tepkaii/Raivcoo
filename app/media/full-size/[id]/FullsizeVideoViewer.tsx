// app/media/full-size/[id]/FullsizeVideoViewer.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlayerControls } from "@/app/review/[token]/review_components/PlayerControls";
import { ClickAnimation } from "@/app/review/[token]/lib/ClickAnimation";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
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

interface FullsizeVideoViewerProps {
  mediaFile: MediaFile;
}

export function FullsizeVideoViewer({ mediaFile }: FullsizeVideoViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false); // ✅ ADD THIS STATE
  const [showClickAnimation, setShowClickAnimation] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ ADD VIDEO READY STATE MANAGEMENT (from MediaInterface)
  useEffect(() => {
    if (mediaFile.file_type === "image") {
      setIsVideoReady(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setIsVideoReady(false);
      return;
    }

    // Reset state when video source changes
    setIsVideoReady(false);
    setCurrentTime(0);

    const checkVideoReady = () => {
      if (video.readyState >= 1) {
        setCurrentTime(video.currentTime);
        setIsVideoReady(true);
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
  }, [mediaFile.file_type, mediaFile.r2_url]); // ✅ ADD r2_url as dependency

  // Auto-hide controls logic
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused && isVideoReady) {
        // ✅ CHECK isVideoReady
        setShowControls(false);
      }
    }, 3000);
  }, [isVideoReady]);

  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (video && isVideoReady) {
      if (video.paused) {
        video.play().catch(console.error);
        setShowClickAnimation(true);
      } else {
        video.pause();
        setShowClickAnimation(true);
      }
    }
    resetControlsTimeout();
  }, [isVideoReady, resetControlsTimeout]);

  // Add animation complete handler
  const handleAnimationComplete = useCallback(() => {
    setShowClickAnimation(false);
  }, []);

  // ✅ PROPER TIME UPDATE HANDLER (from MediaInterface)
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // ✅ SEEK TO TIMESTAMP HANDLER (from MediaInterface)
  const handleSeekToTimestamp = useCallback(
    (timestamp: number) => {
      if (videoRef.current && mediaFile.file_type === "video" && isVideoReady) {
        videoRef.current.currentTime = timestamp;
      }
    },
    [mediaFile.file_type, isVideoReady]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaFile.file_type !== "video") return;

    const handlePlay = () => setVideoPlaying(true);
    const handlePause = () => setVideoPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [mediaFile.file_type]);
  // Show/hide controls based on video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaFile.file_type === "image" || !isVideoReady) return;

    const handlePlay = () => resetControlsTimeout();
    const handlePause = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [resetControlsTimeout, mediaFile.file_type, isVideoReady]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={fullscreenContainerRef}
      className="min-h-screen bg-black relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video/Image Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {mediaFile.file_type === "video" ? (
          <>
            <video
              ref={videoRef}
              src={mediaFile.r2_url}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={handleVideoClick}
              playsInline
              preload="metadata"
              controls={false} // ✅ EXPLICITLY DISABLE NATIVE CONTROLS
            />
            <ClickAnimation
              show={showClickAnimation}
              isPlaying={videoPlaying}
              onAnimationComplete={handleAnimationComplete}
            />
          </>
        ) : (
          <img
            src={mediaFile.r2_url}
            alt={mediaFile.original_filename}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Controls Overlay for Videos */}
      {mediaFile.file_type === "video" && (
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <PlayerControls
            videoRef={videoRef}
            mediaType={mediaFile.file_type}
            comments={[]} // ✅ PASS EMPTY ARRAY FOR COMMENTS
            onSeekToTimestamp={handleSeekToTimestamp} // ✅ ADD SEEK HANDLER
            onTimeUpdate={handleTimeUpdate}
            fullscreenContainerRef={fullscreenContainerRef}
            authenticatedUser={null} // ✅ ADD AUTHENTICATED USER (null for fullsize viewer)
          />
        </div>
      )}

      {/* Top overlay with back button */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
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

      {/* ✅ LOADING STATE (from MediaInterface) */}
      {mediaFile.file_type === "video" && !isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
}