// app/review/[token]/review_components/MediaDisplay.tsx
// @ts-nocheck
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { PinTool } from "./PinTool";
import { DrawTool } from "./DrawingTool";

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
  allowDownload?: boolean;
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
  allowDownload = false,
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

  // ✅ CALCULATE ACTUAL VIDEO SIZE - NOW AS USEMEMO FOR INSTANT UPDATES
  const actualVideoSize = useMemo(() => {
    if (!mediaDimensions || !displaySize) return null;

    const containerAspect = displaySize.width / displaySize.height;
    const videoAspect = mediaDimensions.width / mediaDimensions.height;

    let actualWidth, actualHeight, offsetX, offsetY;

    if (videoAspect > containerAspect) {
      // Video is wider relative to container - fit by width
      actualWidth = displaySize.width;
      actualHeight = displaySize.width / videoAspect;
      offsetX = 0;
      offsetY = (displaySize.height - actualHeight) / 2;
    } else {
      // Video is taller relative to container - fit by height
      actualHeight = displaySize.height;
      actualWidth = displaySize.height * videoAspect;
      offsetX = (displaySize.width - actualWidth) / 2;
      offsetY = 0;
    }

    return { width: actualWidth, height: actualHeight, offsetX, offsetY };
  }, [mediaDimensions, displaySize]);

  // Calculate current scale percentage
  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;
    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.round(scale * 100);
  };

  // ✅ IMMEDIATE DISPLAY METRICS UPDATE - NO DELAYS
  const updateDisplayMetrics = useCallback(() => {
    const element = mediaElementRef.current;
    const container = containerRef.current;
    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // ✅ UPDATE BOTH AT SAME TIME - NO SEPARATE STATE UPDATES
      const newDisplaySize = {
        width: elementRect.width,
        height: elementRect.height,
      };

      const newDisplayPosition = {
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
      };

      setDisplaySize(newDisplaySize);
      setDisplayPosition(newDisplayPosition);
    }
  }, []);

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

          // ✅ IMMEDIATE UPDATE - NO TIMEOUT
          updateDisplayMetrics();
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

        // ✅ IMMEDIATE UPDATE - NO TIMEOUT
        updateDisplayMetrics();
      };
      img.src = media.r2_url;
    }
  }, [media.r2_url, media.file_type, videoRef, updateDisplayMetrics]);

  // ✅ SIMPLIFIED RESIZE OBSERVER - NO DELAYS
  useEffect(() => {
    const element = mediaElementRef.current;
    const container = containerRef.current;
    if (!element || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // ✅ Use double requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateDisplayMetrics();
        });
      });
    });

    // ✅ Observe BOTH the media element AND the container
    resizeObserver.observe(element);
    resizeObserver.observe(container); // This was missing!

    const handleResize = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateDisplayMetrics();
        });
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [updateDisplayMetrics]);
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

  // Memoized active comment pins - FIX for infinite loop
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

  // Memoized active comment drawings - FIX for infinite loop
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

  const currentScale = getCurrentScale();

  useEffect(() => {
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

        {/* Media Container - FULL SIZE */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* ✅ DYNAMIC BORDER WRAPPER - ONLY RENDER WHEN READY */}
          {actualVideoSize && displaySize && displayPosition && (
            <div
              className="absolute border-2 border-blue-600 rounded-none shadow-2xl pointer-events-none z-20"
              style={{
                left: `${actualVideoSize.offsetX}px`,
                top: `${actualVideoSize.offsetY}px`,
                width: `${actualVideoSize.width}px`,
                height: `${actualVideoSize.height}px`,
              }}
            />
          )}

          {/* Video Element - NO BORDER, FULL SIZE */}
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain" as const,
              objectPosition: "center center",
              userSelect: allowDownload ? ("auto" as const) : ("none" as const),
              pointerEvents: "auto" as const,
              display: "block",
            }}
            className="block"
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
          />
        </div>

        {/* ✅ ONLY RENDER TOOLS WHEN ALL DATA IS READY */}
        {displaySize &&
          displayPosition &&
          mediaDimensions &&
          actualVideoSize && (
            <>
              {/* Pin Tool Overlay */}
              <PinTool
                isActive={annotationMode === "pin"}
                displaySize={displaySize}
                displayPosition={displayPosition}
                mediaDimensions={{
                  width: mediaDimensions.width,
                  height: mediaDimensions.height,
                }}
                currentTime={videoRef?.current?.currentTime || 0}
                currentScale={currentScale}
                onCancel={() => {}}
                existingPins={activeCommentPins}
                mediaElementRef={mediaElementRef}
                color={annotationConfig.color}
                actualVideoSize={actualVideoSize}
              />

              {/* Draw Tool Overlay */}
              <DrawTool
                isActive={annotationMode === "drawing"}
                displaySize={displaySize}
                displayPosition={displayPosition}
                mediaDimensions={{
                  width: mediaDimensions.width,
                  height: mediaDimensions.height,
                }}
                currentTime={videoRef?.current?.currentTime || 0}
                currentScale={currentScale}
                onDrawingComplete={handleDrawComplete}
                onCancel={() => {}}
                existingDrawings={activeCommentDrawings}
                mediaElementRef={mediaElementRef}
                color={annotationConfig.color}
                thickness={annotationConfig.thickness}
                shape={annotationConfig.shape}
                actualVideoSize={actualVideoSize}
              />
            </>
          )}

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
      {/* ✅ DOWNLOAD RESTRICTION OVERLAY */}
      {!allowDownload && (
        <div
          className="absolute inset-0 z-40 pointer-events-none select-none"
          style={{
            background: "transparent",
            userSelect: "none",
          }}
        />
      )}

      {/* Media Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* ✅ DYNAMIC BORDER WRAPPER - ONLY RENDER WHEN READY */}
        {actualVideoSize && displaySize && displayPosition && (
          <div
            className="absolute border-2 border-blue-600 rounded-none shadow-2xl pointer-events-none z-20"
            style={{
              left: `${actualVideoSize.offsetX}px`,
              top: `${actualVideoSize.offsetY}px`,
              width: `${actualVideoSize.width}px`,
              height: `${actualVideoSize.height}px`,
            }}
          />
        )}

        <img
          ref={(el) => {
            mediaElementRef.current = el;
          }}
          src={media.r2_url}
          alt={media.original_filename}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain" as const,
            objectPosition: "center center",
            userSelect: allowDownload ? ("auto" as const) : ("none" as const),
            pointerEvents: "auto" as const,
            display: "block",
          }}
          className="block"
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          draggable={allowDownload}
        />
      </div>

      {/* ✅ ONLY RENDER TOOLS WHEN ALL DATA IS READY */}
      {displaySize && displayPosition && mediaDimensions && actualVideoSize && (
        <>
          {/* Pin Tool Overlay */}
          <PinTool
            isActive={annotationMode === "pin"}
            displaySize={displaySize}
            displayPosition={displayPosition}
            mediaDimensions={{
              width: mediaDimensions.width,
              height: mediaDimensions.height,
            }}
            currentScale={currentScale}
            onCancel={() => {}}
            existingPins={activeCommentPins}
            mediaElementRef={mediaElementRef}
            color={annotationConfig.color}
            actualVideoSize={actualVideoSize}
          />

          {/* Draw Tool Overlay */}
          <DrawTool
            isActive={annotationMode === "drawing"}
            displaySize={displaySize}
            displayPosition={displayPosition}
            mediaDimensions={{
              width: mediaDimensions.width,
              height: mediaDimensions.height,
            }}
            currentScale={currentScale}
            onDrawingComplete={handleDrawComplete}
            onCancel={() => {}}
            existingDrawings={activeCommentDrawings}
            mediaElementRef={mediaElementRef}
            color={annotationConfig.color}
            thickness={annotationConfig.thickness}
            shape={annotationConfig.shape}
            actualVideoSize={actualVideoSize}
          />
        </>
      )}

      {/* Loading state */}
      {!mediaDimensions && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading media...</div>
        </div>
      )}
    </div>
  );
};
