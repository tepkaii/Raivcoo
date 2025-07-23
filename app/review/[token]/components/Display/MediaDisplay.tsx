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
import { ClickAnimation } from "./ClickAnimation";
import {
  DocumentIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { getFileCategory } from "@/app/dashboard/utilities";

interface MediaDisplayProps {
  media: any;
  videoRef?: React.RefObject<HTMLVideoElement>;
  audioRef?: React.RefObject<HTMLAudioElement>;
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
  audioRef,
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

  // Animation states
  const [showPlayPauseAnimation, setShowPlayPauseAnimation] = useState(false);
  const [showBackwardAnimation, setShowBackwardAnimation] = useState(false);
  const [showForwardAnimation, setShowForwardAnimation] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Double click detection
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [clickCount, setClickCount] = useState(0);

  const fileCategory = getFileCategory(media.file_type, media.mime_type);

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

  // Handle video seeking
  const seekVideo = useCallback(
    (seconds: number) => {
      const video = videoRef?.current;
      if (video && fileCategory === "video") {
        const newTime = Math.max(
          0,
          Math.min(video.duration, video.currentTime + seconds)
        );
        video.currentTime = newTime;
      }
    },
    [fileCategory, videoRef]
  );

  // Handle video clicks with position detection
  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      const video = videoRef?.current;
      if (!video || fileCategory !== "video") return;

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
    },
    [fileCategory, videoRef, clickCount, clickTimeout, seekVideo]
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

  // Calculate actual video size
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

  // Update display metrics
  const updateDisplayMetrics = useCallback(() => {
    const element = mediaElementRef.current;
    const container = containerRef.current;
    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

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

  useEffect(() => {
    const video = videoRef?.current;
    if (!video || fileCategory !== "video") return;

    const handlePlay = () => setVideoPlaying(true);
    const handlePause = () => setVideoPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [fileCategory, videoRef]);

  // Load media dimensions
  useEffect(() => {
    if (fileCategory === "video") {
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
    } else if (fileCategory === "image") {
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

        updateDisplayMetrics();
      };
      img.src = media.r2_url;
    }
  }, [media.r2_url, fileCategory, videoRef, updateDisplayMetrics]);

  // Resize observer
  useEffect(() => {
    const element = mediaElementRef.current;
    const container = containerRef.current;
    if (!element || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateDisplayMetrics();
        });
      });
    });

    resizeObserver.observe(element);
    resizeObserver.observe(container);

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

  // Disable browser shortcuts if downloads disabled
  useEffect(() => {
    if (!allowDownload) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          return false;
        }
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && e.key === "u") {
          e.preventDefault();
          return false;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [allowDownload]);

  // Memoized active comment pins
  const activeCommentPins = useMemo(() => {
    if (
      !activeCommentPin ||
      !comments.length ||
      (fileCategory !== "image" && fileCategory !== "video")
    )
      return [];

    const comment = comments.find((c) => c.id === activeCommentPin);
    if (!comment || !comment.annotation_data) return [];

    let commentTimestamp = undefined;

    if (comment.annotation_data.timestamp !== undefined) {
      commentTimestamp = comment.annotation_data.timestamp;
    } else if (comment.timestamp_seconds !== undefined) {
      commentTimestamp = comment.timestamp_seconds;
    } else if (comment.timestamp_start_seconds !== undefined) {
      commentTimestamp = comment.timestamp_start_seconds;
    }

    if (commentTimestamp !== undefined && videoRef?.current) {
      const timeDiff = Math.abs(currentTime - commentTimestamp);
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
  }, [
    activeCommentPin,
    comments,
    currentTime,
    videoRef?.current?.paused,
    fileCategory,
  ]);

  // Memoized active comment drawings
  const activeCommentDrawings = useMemo(() => {
    if (
      !activeCommentDrawing ||
      !comments.length ||
      (fileCategory !== "image" && fileCategory !== "video")
    )
      return [];

    const comment = comments.find((c) => c.id === activeCommentDrawing);
    if (!comment || !comment.drawing_data) return [];

    let commentTimestamp = undefined;

    if (comment.drawing_data.timestamp !== undefined) {
      commentTimestamp = comment.drawing_data.timestamp;
    } else if (comment.timestamp_seconds !== undefined) {
      commentTimestamp = comment.timestamp_seconds;
    } else if (comment.timestamp_start_seconds !== undefined) {
      commentTimestamp = comment.timestamp_start_seconds;
    }

    if (commentTimestamp !== undefined && videoRef?.current) {
      const timeDiff = Math.abs(currentTime - commentTimestamp);
      if (timeDiff > 0.5 || !videoRef.current.paused) {
        return [];
      }
    }

    return [comment.drawing_data];
  }, [
    activeCommentDrawing,
    comments,
    currentTime,
    videoRef?.current?.paused,
    fileCategory,
  ]);

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
    if (annotationMode === "none") {
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

  // Render media content
  const renderMediaContent = () => {
    switch (fileCategory) {
      case "video":
        return (
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
            onClick={handleVideoClick}
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
        );

      case "image":
        return (
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
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-purple-600 to-blue-800 p-8">
            <MusicalNoteIcon className="h-24 w-24 text-white/80 mb-6" />
            <audio
              ref={audioRef}
              src={media.r2_url}
              preload="metadata"
              onContextMenu={handleContextMenu}
              controlsList={!allowDownload ? "nodownload" : undefined}
              style={{ display: "none" }}
            />
            <div className="text-center">
              <h3 className="text-white/90 text-lg font-medium mb-2">
                {media.original_filename}
              </h3>
              <p className="text-white/60 text-sm">Audio File</p>
            </div>
          </div>
        );

      case "svg":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-green-600 to-teal-800 p-8">
            <CodeBracketIcon className="h-24 w-24 text-white/80 mb-6" />
            <div className="text-center">
              <h3 className="text-white/90 text-lg font-medium mb-2">
                SVG Vector File
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {media.original_filename}
              </p>
              <Button
                onClick={() => window.open(media.r2_url, "_blank")}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                View SVG
              </Button>
            </div>
          </div>
        );

      case "document":
        if (media.mime_type === "application/pdf") {
          return (
            <div className="w-full h-full">
              <iframe
                src={`${media.r2_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={media.original_filename}
                onContextMenu={handleContextMenu}
              />
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800 p-8">
              <DocumentIcon className="h-24 w-24 text-white/80 mb-6" />
              <div className="text-center">
                <h3 className="text-white/90 text-lg font-medium mb-2">
                  Document File
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  {media.original_filename}
                </p>
                <Button
                  onClick={() => window.open(media.r2_url, "_blank")}
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
            <DocumentIcon className="h-24 w-24 text-white/80 mb-6" />
            <div className="text-center">
              <h3 className="text-white/90 text-lg font-medium mb-2">
                Unsupported File Type
              </h3>
              <p className="text-white/60 text-sm">{media.original_filename}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
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
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Dynamic border wrapper - only for image/video */}
        {(fileCategory === "image" || fileCategory === "video") &&
          actualVideoSize &&
          displaySize &&
          displayPosition && (
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

        {/* Render Media Content */}
        {renderMediaContent()}

        {/* Click Animations for Video */}
        {fileCategory === "video" && (
          <>
            {/* Play/Pause Animation - Center */}
            <ClickAnimation
              show={showPlayPauseAnimation}
              isPlaying={videoPlaying}
              animationType="play-pause"
              position="center"
              onAnimationComplete={handlePlayPauseAnimationComplete}
            />

            {/* Backward Animation - Left */}
            <ClickAnimation
              show={showBackwardAnimation}
              animationType="backward"
              position="left"
              onAnimationComplete={handleBackwardAnimationComplete}
            />

            {/* Forward Animation - Right */}
            <ClickAnimation
              show={showForwardAnimation}
              animationType="forward"
              position="right"
              onAnimationComplete={handleForwardAnimationComplete}
            />
          </>
        )}
      </div>

      {/* Only render annotation tools for image/video */}
      {(fileCategory === "image" || fileCategory === "video") &&
        displaySize &&
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

      {/* Loading state - only for image/video */}
      {(fileCategory === "image" || fileCategory === "video") &&
        !mediaDimensions && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading media...</div>
          </div>
        )}
    </div>
  );
};
