"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { PinTool } from "./PinTool";
import { DrawTool } from "./DrawingTool";
import { getDetailedQuality, getQualityLabel } from "../lib/mediaQuality";

interface MediaDisplayProps {
  media: any;
  videoRef?: React.RefObject<HTMLVideoElement>;
  className?: string;
  onAnnotationComplete?: (annotationData: any) => void;
  activeCommentPin?: string | null;
  activeCommentDrawing?: string | null;
  comments?: any[];
  currentTime?: number;
  annotationMode?: "none" | "pin" | "drawing";
  annotationConfig?: any;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  videoRef,
  className = "",
  onAnnotationComplete,
  activeCommentPin,
  activeCommentDrawing,
  comments = [],
  currentTime = 0,
  annotationMode = "none",
  annotationConfig = {},
}) => {
  const [displaySize, setDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displayPosition, setDisplayPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [mediaDimensions, setMediaDimensions] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
    isVertical: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

  // Calculate current scale percentage
  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;
    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.round(scale * 100);
  };

  const getQualityInfo = () => {
    if (!mediaDimensions) return null;
    const { width, height } = mediaDimensions;
    return {
      label: getQualityLabel(width, height),
      detailed: getDetailedQuality(width, height),
      dimensions: `${width}×${height}`,
      aspectRatio: (width / height).toFixed(2),
    };
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

  // Handle pin completion
  const handlePinComplete = (pin: any) => {
    if (onAnnotationComplete) {
      onAnnotationComplete({
        type: "pin",
        data: {
          ...pin,
          color: annotationConfig.color || "#ff0000",
        },
        timestamp: videoRef?.current?.currentTime || 0,
      });
    }
  };

  // Handle drawing completion
  const handleDrawComplete = (drawing: any) => {
    if (onAnnotationComplete) {
      onAnnotationComplete({
        type: "drawing",
        data: drawing,
        timestamp: videoRef?.current?.currentTime || 0,
      });
    }
  };

  // FIXED: Memoize the active comment pin data
  const activeCommentPins = useMemo(() => {
    if (!activeCommentPin || !comments.length) return [];

    const comment = comments.find((c) => c.id === activeCommentPin);
    if (!comment || !comment.annotation_data) return [];

    // Check if we should show this pin based on current time
    if (comment.timestamp_seconds !== undefined && videoRef?.current) {
      const timeDiff = Math.abs(currentTime - comment.timestamp_seconds);
      // Only show if within 0.5 seconds and video is paused
      if (timeDiff > 0.5 || !videoRef.current.paused) {
        return [];
      }
    }

    return [
      {
        ...comment.annotation_data,
        id: comment.id,
        color: comment.annotation_data.color || "#ff0000",
      },
    ];
  }, [activeCommentPin, comments, currentTime, videoRef?.current?.paused]);

  // FIXED: Memoize the active comment drawing data
  const activeCommentDrawings = useMemo(() => {
    if (!activeCommentDrawing || !comments.length) return [];

    const comment = comments.find((c) => c.id === activeCommentDrawing);
    if (!comment || !comment.drawing_data) return [];

    // Check if we should show this drawing based on current time
    if (comment.timestamp_seconds !== undefined && videoRef?.current) {
      const timeDiff = Math.abs(currentTime - comment.timestamp_seconds);
      // Only show if within 0.5 seconds and video is paused
      if (timeDiff > 0.5 || !videoRef.current.paused) {
        return [];
      }
    }

    return [comment.drawing_data];
  }, [activeCommentDrawing, comments, currentTime, videoRef?.current?.paused]);

  const currentScale = getCurrentScale();

  useEffect(() => {
    console.log("MediaDisplay annotation mode changed:", annotationMode);

    // When annotation mode changes to "none", ensure tools are properly disabled
    if (annotationMode === "none") {
      // Clear any pending annotations in the tools
      if (typeof window !== "undefined") {
        if ((window as any).clearCurrentDrawing) {
          (window as any).clearCurrentDrawing();
        }
        if ((window as any).clearCurrentPin) {
          (window as any).clearCurrentPin();
        }
      }
    }
  }, [annotationMode]);

  if (media.file_type === "video") {
    return (
      <div ref={containerRef} className={`relative bg-black ${className}`}>
        {/* Media Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {mediaDimensions && (
            <div className="absolute top-4 right-4 z-30 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono">
              {getQualityInfo()?.label}
            </div>
          )}
          <div
            className={`relative border-2 border-blue-600 rounded-none overflow-hidden shadow-2xl ${getContainerStyles()}`}
          >
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
          </div>
        </div>

        {/* Pin Tool Overlay */}
        <PinTool
          isActive={annotationMode === "pin"}
          displaySize={displaySize}
          displayPosition={displayPosition}
          mediaDimensions={
            mediaDimensions
              ? {
                  width: mediaDimensions.width,
                  height: mediaDimensions.height,
                }
              : null
          }
          currentTime={videoRef?.current?.currentTime || 0}
          currentScale={currentScale}
          onCancel={() => {}}
          existingPins={activeCommentPins}
          mediaElementRef={mediaElementRef}
          color={annotationConfig.color}
        />

        {/* Draw Tool Overlay */}
        <DrawTool
          isActive={annotationMode === "drawing"}
          displaySize={displaySize}
          displayPosition={displayPosition}
          mediaDimensions={
            mediaDimensions
              ? {
                  width: mediaDimensions.width,
                  height: mediaDimensions.height,
                }
              : null
          }
          currentTime={videoRef?.current?.currentTime || 0}
          currentScale={currentScale}
          onDrawingComplete={handleDrawComplete}
          onCancel={() => {}}
          existingDrawings={activeCommentDrawings}
          mediaElementRef={mediaElementRef}
          color={annotationConfig.color}
          thickness={annotationConfig.thickness}
          shape={annotationConfig.shape}
        />

        {/* Loading state */}
        {!mediaDimensions && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading media...</div>
          </div>
        )}
      </div>
    );
  }

  // Image display
  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
      {/* Media Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className={`relative border-2 border-blue-600 rounded-none overflow-hidden shadow-2xl ${getContainerStyles()}`}
        >
          <img
            ref={(el) => {
              mediaElementRef.current = el;
            }}
            src={media.r2_url}
            alt={media.original_filename}
            style={getMediaStyles()}
            className="block"
          />
        </div>
      </div>

      {/* Pin Tool Overlay */}
      <PinTool
        isActive={annotationMode === "pin"}
        displaySize={displaySize}
        displayPosition={displayPosition}
        mediaDimensions={
          mediaDimensions
            ? {
                width: mediaDimensions.width,
                height: mediaDimensions.height,
              }
            : null
        }
        currentScale={currentScale}
        onCancel={() => {}}
        existingPins={activeCommentPins}
        mediaElementRef={mediaElementRef}
        color={annotationConfig.color}
      />

      {/* Draw Tool Overlay */}
      <DrawTool
        isActive={annotationMode === "drawing"}
        displaySize={displaySize}
        displayPosition={displayPosition}
        mediaDimensions={
          mediaDimensions
            ? {
                width: mediaDimensions.width,
                height: mediaDimensions.height,
              }
            : null
        }
        currentScale={currentScale}
        onDrawingComplete={handleDrawComplete}
        onCancel={() => {}}
        existingDrawings={activeCommentDrawings}
        mediaElementRef={mediaElementRef}
        color={annotationConfig.color}
        thickness={annotationConfig.thickness}
        shape={annotationConfig.shape}
      />

      {/* Loading state */}
      {!mediaDimensions && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading media...</div>
        </div>
      )}
    </div>
  );
};
