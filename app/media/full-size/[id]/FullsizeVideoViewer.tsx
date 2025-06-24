// app/media/full-size/[id]/FullsizeVideoViewer.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerControls } from "@/app/review/[token]/review_components/PlayerControls";

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
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls logic
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
    resetControlsTimeout();
  };

  const handleGoBack = () => {
    router.back();
  };

  // Handle time updates from PlayerControls
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // Show/hide controls based on video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, []);

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
          <video
            ref={videoRef}
            src={mediaFile.r2_url}
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={handleVideoClick}
            playsInline
            preload="metadata"
          />
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
            onTimeUpdate={handleTimeUpdate}
            fullscreenContainerRef={fullscreenContainerRef}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-white text-lg">
              {mediaFile.original_filename}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
