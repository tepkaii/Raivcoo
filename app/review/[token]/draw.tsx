"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Pen, Eraser, X } from "lucide-react";

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

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[]; // Percentage coordinates (0-100)
  timestamp?: number; // For videos
  color: string;
  strokeWidth: number;
  mediaWidth: number; // Original media resolution when drawn
  mediaHeight: number;
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

  // Drawing state
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    []
  );
  const [drawingMode, setDrawingMode] = useState<"draw" | "erase">("draw");
  const [strokeColor, setStrokeColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);

  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Convert screen coordinates to percentage coordinates
  const screenToPercentage = (screenX: number, screenY: number) => {
    if (!displaySize) return { x: 0, y: 0 };

    return {
      x: (screenX / displaySize.width) * 100,
      y: (screenY / displaySize.height) * 100,
    };
  };

  // Convert percentage coordinates to screen coordinates
  const percentageToScreen = (percentX: number, percentY: number) => {
    if (!displaySize) return { x: 0, y: 0 };

    return {
      x: (percentX / 100) * displaySize.width,
      y: (percentY / 100) * displaySize.height,
    };
  };

  // Handle mouse down - start drawing
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!mediaDimensions || !displaySize || drawingMode === "erase") return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert to percentage
    const percentagePoint = screenToPercentage(clickX, clickY);

    // Ensure drawing is within bounds
    if (
      percentagePoint.x < 0 ||
      percentagePoint.x > 100 ||
      percentagePoint.y < 0 ||
      percentagePoint.y > 100
    ) {
      return;
    }

    setIsDrawing(true);
    setCurrentPath([percentagePoint]);
  };

  // Handle mouse move - continue drawing
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !mediaDimensions || !displaySize) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const moveX = event.clientX - rect.left;
    const moveY = event.clientY - rect.top;

    const percentagePoint = screenToPercentage(moveX, moveY);

    // Ensure drawing stays within bounds
    if (
      percentagePoint.x < 0 ||
      percentagePoint.x > 100 ||
      percentagePoint.y < 0 ||
      percentagePoint.y > 100
    ) {
      return;
    }

    setCurrentPath((prev) => [...prev, percentagePoint]);
  };

  // Handle mouse up - finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || currentPath.length < 2 || !mediaDimensions) return;

    const newPath: DrawingPath = {
      id: `path_${Date.now()}`,
      points: currentPath,
      color: strokeColor,
      strokeWidth: strokeWidth,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      timestamp:
        media.file_type === "video" && videoRef?.current
          ? videoRef.current.currentTime
          : undefined,
    };

    setDrawingPaths((prev) => [...prev, newPath]);
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Handle eraser click
  const handleEraserClick = (event: React.MouseEvent) => {
    if (drawingMode !== "erase" || !displaySize) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const clickPoint = screenToPercentage(clickX, clickY);

    // Find and remove paths near the click point
    setDrawingPaths((prev) =>
      prev.filter((path) => {
        // Check if any point in the path is near the click
        return !path.points.some((point) => {
          const distance = Math.sqrt(
            Math.pow(point.x - clickPoint.x, 2) +
              Math.pow(point.y - clickPoint.y, 2)
          );
          return distance < 5; // 5% tolerance
        });
      })
    );
  };

  // Convert path points to SVG path string
  const pathToSVG = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    const screenPoints = points.map((p) => percentageToScreen(p.x, p.y));

    let path = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
    for (let i = 1; i < screenPoints.length; i++) {
      path += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
    }

    return path;
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
  const currentScale = getCurrentScale();

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

        {/* Drawing count badge */}
        {drawingPaths.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-purple-600/70 text-white text-xs border border-purple-500 block"
          >
            Drawings: {drawingPaths.length}
          </Badge>
        )}
      </div>

      {/* Drawing Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="flex gap-2">
          <Badge
            variant={drawingMode === "draw" ? "default" : "outline"}
            className="cursor-pointer hover:bg-gray-700 px-2 py-1"
            onClick={() => setDrawingMode("draw")}
          >
            <Pen className="w-3 h-3 mr-1" />
            Draw
          </Badge>
          <Badge
            variant={drawingMode === "erase" ? "default" : "outline"}
            className="cursor-pointer hover:bg-gray-700 px-2 py-1"
            onClick={() => setDrawingMode("erase")}
          >
            <Eraser className="w-3 h-3 mr-1" />
            Erase
          </Badge>
        </div>

        {/* Color picker */}
        <div className="flex gap-1">
          {[
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff00ff",
            "#ffffff",
          ].map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 ${strokeColor === color ? "border-white" : "border-gray-500"}`}
              style={{ backgroundColor: color }}
              onClick={() => setStrokeColor(color)}
            />
          ))}
        </div>

        {/* Stroke width */}
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-20"
        />

        <Badge
          variant="outline"
          className="bg-black/70 text-white text-xs border border-gray-600 block cursor-pointer hover:bg-gray-700"
          onClick={() => setDrawingPaths([])}
        >
          Clear All
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
              className={`block ${drawingMode === "draw" ? "cursor-crosshair" : "cursor-pointer"}`}
              playsInline
              preload="metadata"
              controls={false}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={drawingMode === "erase" ? handleEraserClick : undefined}
            />
          ) : (
            <img
              ref={(el) => {
                mediaElementRef.current = el;
              }}
              src={media.r2_url}
              alt={media.original_filename}
              style={getMediaStyles()}
              className={`block ${drawingMode === "draw" ? "cursor-crosshair" : "cursor-pointer"}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={drawingMode === "erase" ? handleEraserClick : undefined}
            />
          )}

          {/* Drawing SVG Overlay */}
          {displaySize && (
            <svg
              ref={svgRef}
              className="absolute top-0 left-0 pointer-events-none"
              width={displaySize.width}
              height={displaySize.height}
              style={{ zIndex: 10 }}
            >
              {/* Existing drawings */}
              {drawingPaths.map((path) => (
                <path
                  key={path.id}
                  d={pathToSVG(path.points)}
                  stroke={path.color}
                  strokeWidth={path.strokeWidth * (currentScale / 100)} // Scale stroke width with media
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Current drawing path */}
              {isDrawing && currentPath.length > 1 && (
                <path
                  d={pathToSVG(currentPath)}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * (currentScale / 100)} // Scale stroke width with media
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          )}
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
          {drawingMode === "draw"
            ? "Click and drag to draw"
            : "Click on drawings to erase"}
        </Badge>
      </div>
    </div>
  );
};
