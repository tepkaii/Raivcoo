"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";

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
}

interface MediaDisplayProps {
  media: MediaFile;
  videoRef?: React.RefObject<HTMLVideoElement>;
  className?: string;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  videoRef,
  className = "",
}) => {
  const [mediaDimensions, setMediaDimensions] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
    isVertical: boolean;
  } | null>(null);

  const [displaySize, setDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

  // Get media dimensions info
  const getMediaInfo = () => {
    const sizeInfo = formatFileSize(media.file_size);
    const originalDimensions = mediaDimensions
      ? `${mediaDimensions.width}×${mediaDimensions.height}`
      : "";
    const currentSize = displaySize
      ? `${Math.round(displaySize.width)}×${Math.round(displaySize.height)}`
      : "";

    return {
      type: media.file_type.toUpperCase(),
      size: sizeInfo,
      originalDimensions,
      currentSize,
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Track display size changes
  const updateDisplaySize = () => {
    const element = mediaElementRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      setDisplaySize({
        width: rect.width,
        height: rect.height,
      });
    }
  };

  // Load media dimensions
  useEffect(() => {
    if (media.file_type === "video") {
      const video = videoRef?.current;
      if (video) {
        const handleLoadedMetadata = () => {
          const width = video.videoWidth;
          const height = video.videoHeight;
          const aspectRatio = width / height;
          const isVertical = height > width;

          setMediaDimensions({
            width,
            height,
            aspectRatio,
            isVertical,
          });

          // Update display size after metadata loads
          setTimeout(updateDisplaySize, 100);
        };

        if (video.readyState >= 1) {
          handleLoadedMetadata();
        } else {
          video.addEventListener("loadedmetadata", handleLoadedMetadata);
          return () =>
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        }
      }
    } else {
      // For images, create a temporary image to get dimensions
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        const isVertical = height > width;

        setMediaDimensions({
          width,
          height,
          aspectRatio,
          isVertical,
        });

        // Update display size after image loads
        setTimeout(updateDisplaySize, 100);
      };
      img.src = media.r2_url;
    }
  }, [media.r2_url, media.file_type, videoRef]);

  // Set up resize observer to track display size changes
  useEffect(() => {
    const element = mediaElementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      updateDisplaySize();
    });

    resizeObserver.observe(element);

    // Also listen to window resize
    window.addEventListener("resize", updateDisplaySize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDisplaySize);
    };
  }, [mediaDimensions]); // Re-run when mediaDimensions change

  const mediaInfo = getMediaInfo();

  // Get media styling based on orientation
  const getMediaStyles = () => {
    if (!mediaDimensions) {
      return {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain" as const,
      };
    }

    const { isVertical, aspectRatio } = mediaDimensions;

    if (isVertical) {
      // Vertical media: take full height, let width adjust
      return {
        width: "auto",
        height: "100%",
        maxHeight: "100%",
        objectFit: "contain" as const,
      };
    } else {
      // Horizontal media: take full width, let height adjust
      return {
        width: "100%",
        height: "auto",
        maxWidth: "100%",
        objectFit: "contain" as const,
      };
    }
  };

  // Get container styling based on orientation
  const getContainerStyles = () => {
    if (!mediaDimensions) {
      return "max-w-full max-h-full";
    }

    const { isVertical } = mediaDimensions;

    if (isVertical) {
      // For vertical media, center horizontally and take full height
      return "h-full flex items-center justify-center";
    } else {
      // For horizontal media, center vertically and take full width
      return "w-full flex items-center justify-center";
    }
  };

  // Calculate scale percentage
  const getScalePercentage = () => {
    if (!mediaDimensions || !displaySize) return null;

    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY); // object-fit: contain uses the smaller scale

    return Math.round(scale * 100);
  };

  const scalePercentage = getScalePercentage();

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-black ${className}`}
    >
      {/* Media Info Badges */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {/* Original Resolution Badge */}
        <Badge
          variant="default"
          className="bg-black/70 text-white text-xs border border-gray-600 block"
        >
          {mediaInfo.type}
          {mediaInfo.originalDimensions && ` • ${mediaInfo.originalDimensions}`}
          {` • ${mediaInfo.size}`}
        </Badge>

        {/* Current Display Size Badge */}
        {mediaInfo.currentSize && (
          <Badge
            variant="secondary"
            className="bg-blue-600/70 text-white text-xs border border-blue-500 block"
          >
            Display: {mediaInfo.currentSize}
            {scalePercentage && ` (${scalePercentage}%)`}
          </Badge>
        )}
      </div>

      {/* Media Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className={`relative border-2 border-blue-600 rounded-none overflow-hidden shadow-2xl ${getContainerStyles()}`}
        >
          {media.file_type === "video" ? (
            <video
              ref={(el) => {
                if (videoRef) {
                  (
                    videoRef as React.MutableRefObject<HTMLVideoElement | null>
                  ).current = el;
                }
                mediaElementRef.current = el;
              }}
              src={media.r2_url}
              style={getMediaStyles()}
              className="block"
              playsInline
              preload="metadata"
              controls={false}
            />
          ) : (
            <img
              ref={(el) => {
                mediaElementRef.current = el;
              }}
              src={media.r2_url}
              alt={media.original_filename}
              style={getMediaStyles()}
              className="block"
            />
          )}
        </div>
      </div>

      {/* Loading state while dimensions are being calculated */}
      {!mediaDimensions && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading media...</div>
        </div>
      )}
    </div>
  );
};
