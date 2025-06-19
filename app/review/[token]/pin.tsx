"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";

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

interface AnnotationPin {
  id: string;
  x: number; // Percentage relative to media (0-100)
  y: number; // Percentage relative to media (0-100)
  timestamp?: number; // For videos
  content: string;
  mediaWidth: number; // Original media width when pin was created
  mediaHeight: number; // Original media height when pin was created
  createdAtScale: number; // Scale percentage when pin was created (this is the "original" size for this pin)
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

  const [displayPosition, setDisplayPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  // Test annotation pins
  const [annotationPins, setAnnotationPins] = useState<AnnotationPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate current scale percentage
  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;

    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);

    return Math.round(scale * 100);
  };

  // Calculate pin scale factor based on current scale vs creation scale
  const getPinScaleFactor = (pin: AnnotationPin) => {
    const currentScale = getCurrentScale();

    // If current scale is smaller than creation scale, scale down the pin
    if (currentScale < pin.createdAtScale) {
      return currentScale / pin.createdAtScale;
    }

    // If current scale is larger than creation scale, keep pin at original size
    return 1;
  };

  // Track display size and position changes
  const updateDisplayMetrics = () => {
    const element = mediaElementRef.current;
    const container = containerRef.current;
    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setDisplaySize({
        width: elementRect.width,
        height: elementRect.height,
      });

      // Position relative to container
      setDisplayPosition({
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
      });
    }
  };

  // Handle click on media to add annotation pin
  const handleMediaClick = (event: React.MouseEvent) => {
    if (!mediaDimensions || !displaySize || !displayPosition) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert to percentage relative to media
    const percentageX = (clickX / displaySize.width) * 100;
    const percentageY = (clickY / displaySize.height) * 100;

    // Ensure pin is within bounds
    if (
      percentageX < 0 ||
      percentageX > 100 ||
      percentageY < 0 ||
      percentageY > 100
    ) {
      return;
    }

    const currentScale = getCurrentScale();

    const newPin: AnnotationPin = {
      id: `pin_${Date.now()}`,
      x: percentageX,
      y: percentageY,
      content: `Pin at ${Math.round(percentageX)}%, ${Math.round(percentageY)}%`,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: currentScale, // Store the scale when pin was created
      timestamp:
        media.file_type === "video" && videoRef?.current
          ? videoRef.current.currentTime
          : undefined,
    };

    setAnnotationPins((prev) => [...prev, newPin]);
    setSelectedPin(newPin.id);
  };

  // Remove annotation pin
  const removePin = (pinId: string) => {
    setAnnotationPins((prev) => prev.filter((pin) => pin.id !== pinId));
    setSelectedPin(null);
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

          setTimeout(updateDisplayMetrics, 100);
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

        setTimeout(updateDisplayMetrics, 100);
      };
      img.src = media.r2_url;
    }
  }, [media.r2_url, media.file_type, videoRef]);

  // Set up resize observer
  useEffect(() => {
    const element = mediaElementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      updateDisplayMetrics();
    });

    resizeObserver.observe(element);
    window.addEventListener("resize", updateDisplayMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDisplayMetrics);
    };
  }, [mediaDimensions]);

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

    const { isVertical } = mediaDimensions;

    if (isVertical) {
      return {
        width: "auto",
        height: "100%",
        maxHeight: "100%",
        objectFit: "contain" as const,
      };
    } else {
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
      return "h-full flex items-center justify-center";
    } else {
      return "w-full flex items-center justify-center";
    }
  };

  const currentScale = getCurrentScale();

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-black ${className}`}
    >
      {/* Media Info Badges */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Badge
          variant="default"
          className="bg-black/70 text-white text-xs border border-gray-600 block"
        >
          {mediaInfo.type}
          {mediaInfo.originalDimensions && ` • ${mediaInfo.originalDimensions}`}
          {` • ${mediaInfo.size}`}
        </Badge>

        {mediaInfo.currentSize && (
          <Badge
            variant="secondary"
            className="bg-blue-600/70 text-white text-xs border border-blue-500 block"
          >
            Display: {mediaInfo.currentSize} ({currentScale}%)
          </Badge>
        )}

        {/* Pin count badge */}
        {annotationPins.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-purple-600/70 text-white text-xs border border-purple-500 block"
          >
            Pins: {annotationPins.length}
          </Badge>
        )}
      </div>

      {/* Test Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Badge
          variant="outline"
          className="bg-black/70 text-white text-xs border border-gray-600 block cursor-pointer hover:bg-gray-700"
          onClick={() => setAnnotationPins([])}
        >
          Clear All Pins
        </Badge>
      </div>

      {/* Media Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
      >
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
              className="block cursor-crosshair"
              playsInline
              preload="metadata"
              controls={false}
              onClick={handleMediaClick}
            />
          ) : (
            <img
              ref={(el) => {
                mediaElementRef.current = el;
              }}
              src={media.r2_url}
              alt={media.original_filename}
              style={getMediaStyles()}
              className="block cursor-crosshair"
              onClick={handleMediaClick}
            />
          )}

          {/* Annotation Pins Overlay */}
          {displaySize &&
            displayPosition &&
            annotationPins.map((pin) => {
              // Calculate pin position based on current display size
              const pinX = (pin.x / 100) * displaySize.width;
              const pinY = (pin.y / 100) * displaySize.height;

              // Calculate pin scale factor
              const scaleFactor = getPinScaleFactor(pin);
              const minScale = 0.3; // Minimum pin size (30% of original)
              const finalScale = Math.max(scaleFactor, minScale);

              return (
                <div
                  key={pin.id}
                  className="absolute z-20 group"
                  style={{
                    left: `${pinX}px`,
                    top: `${pinY}px`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                    transformOrigin: "center",
                  }}
                >
                  {/* Pin Icon */}
                  <div
                    className={`relative cursor-pointer transition-all duration-200 ${
                      selectedPin === pin.id ? "scale-125" : "hover:scale-110"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin(selectedPin === pin.id ? null : pin.id);
                    }}
                  >
                    <MapPin
                      className={`w-6 h-6 ${
                        selectedPin === pin.id
                          ? "text-yellow-400"
                          : "text-red-500"
                      } drop-shadow-lg`}
                      fill="currentColor"
                    />

                    {/* Pin number */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 bg-white text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                      {annotationPins.findIndex((p) => p.id === pin.id) + 1}
                    </div>
                  </div>

                  {/* Pin Tooltip */}
                  {selectedPin === pin.id && (
                    <div
                      className="absolute top-8 left-1/2 bg-black/90 text-white text-xs p-2 rounded whitespace-nowrap border border-gray-600 min-w-48"
                      style={{
                        transform: `translateX(-50%) scale(${1 / finalScale})`, // Counter-scale the tooltip
                        transformOrigin: "top center",
                      }}
                    >
                      <div className="font-medium">{pin.content}</div>
                      <div className="text-gray-300 mt-1">
                        Position: {pin.x.toFixed(1)}%, {pin.y.toFixed(1)}%
                      </div>
                      <div className="text-gray-300">
                        Created at: {pin.createdAtScale}% scale
                      </div>
                      <div className="text-gray-300">
                        Current scale: {finalScale.toFixed(2)}x
                      </div>
                      {pin.timestamp !== undefined && (
                        <div className="text-gray-300">
                          Time: {Math.round(pin.timestamp)}s
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePin(pin.id);
                        }}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Loading state */}
      {!mediaDimensions && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading media...</div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10">
        <Badge
          variant="outline"
          className="bg-black/70 text-white text-xs border border-gray-600"
        >
          Click on media to add pins
        </Badge>
      </div>
    </div>
  );
};
