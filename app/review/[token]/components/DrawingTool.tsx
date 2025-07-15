"use client";

import React, { useState, useEffect, useRef } from "react";

interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  thickness: number;
  shape?: "freehand" | "line" | "circle" | "square" | "arrow";
  timestamp?: number;
  mediaWidth: number;
  mediaHeight: number;
  createdAtScale: number;
}

interface DrawingAnnotation {
  id: string;
  strokes: DrawingStroke[];
  timestamp?: number;
  mediaWidth: number;
  mediaHeight: number;
  createdAtScale: number;
}

interface DrawToolProps {
  isActive: boolean;
  displaySize: { width: number; height: number } | null;
  displayPosition: { left: number; top: number } | null;
  mediaDimensions: { width: number; height: number } | null;
  currentTime?: number;
  currentScale: number;
  onDrawingComplete?: (drawing: DrawingAnnotation) => void;
  onCancel?: () => void;
  existingDrawings?: DrawingAnnotation[];
  mediaElementRef: React.RefObject<HTMLVideoElement | HTMLImageElement>;
  color?: string;
  thickness?: number;
  shape?: "freehand" | "line" | "circle" | "square" | "arrow";
  actualVideoSize?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null;
}

export const DrawTool: React.FC<DrawToolProps> = ({
  isActive,
  displaySize,
  displayPosition,
  mediaDimensions,
  currentTime,
  currentScale,
  onDrawingComplete,
  onCancel,
  existingDrawings = [],
  mediaElementRef,
  color = "#ff0000",
  thickness = 3,
  shape = "freehand",
  actualVideoSize,
}) => {
  const [drawings, setDrawings] =
    useState<DrawingAnnotation[]>(existingDrawings);
  const [currentDrawing, setCurrentDrawing] =
    useState<DrawingAnnotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(
    null
  );
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setDrawings(existingDrawings);
  }, [existingDrawings]);

  // Clear drawing when annotation mode is turned off
  useEffect(() => {
    const clearCurrentDrawing = () => {
      setCurrentDrawing(null);
      setCurrentStroke(null);
      setIsDrawing(false);
      setStartPoint(null);
    };

    if (typeof window !== "undefined") {
      (window as any).clearCurrentDrawing = clearCurrentDrawing;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).clearCurrentDrawing;
      }
    };
  }, []);

  // Set up global undo function - ALWAYS call this useEffect
  useEffect(() => {
    const undoLastStroke = () => {
      if (currentDrawing && currentDrawing.strokes.length > 0) {
        const updatedDrawing = {
          ...currentDrawing,
          strokes: currentDrawing.strokes.slice(0, -1),
        };
        setCurrentDrawing(updatedDrawing);

        // Update the stroke count in the comments component
        if (
          typeof window !== "undefined" &&
          (window as any).handleAnnotationComplete
        ) {
          (window as any).handleAnnotationComplete({
            type: "drawing",
            data: updatedDrawing,
          });
        }
      }
    };

    if (typeof window !== "undefined") {
      (window as any).undoLastStroke = undoLastStroke;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).undoLastStroke;
      }
    };
  }, [currentDrawing]);

  if (!displaySize || !displayPosition || !mediaDimensions) return null;

  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;
    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.round(scale * 100);
  };

  const getDrawingScaleFactor = (drawing: DrawingAnnotation) => {
    const currentScale = getCurrentScale();
    if (currentScale < drawing.createdAtScale) {
      return currentScale / drawing.createdAtScale;
    }
    return 1;
  };

  // ✅ USE ACTUAL VIDEO SIZE FOR COORDINATE CONVERSION
  const screenToPercentage = (screenX: number, screenY: number) => {
    if (!actualVideoSize) {
      // Fallback to old method if actualVideoSize not available
      return {
        x: (screenX / displaySize!.width) * 100,
        y: (screenY / displaySize!.height) * 100,
      };
    }

    // Adjust for video offset within container
    const adjustedX = screenX - actualVideoSize.offsetX;
    const adjustedY = screenY - actualVideoSize.offsetY;

    return {
      x: Math.max(0, Math.min(100, (adjustedX / actualVideoSize.width) * 100)),
      y: Math.max(0, Math.min(100, (adjustedY / actualVideoSize.height) * 100)),
    };
  };

  const percentageToScreen = (percentX: number, percentY: number) => {
    if (!actualVideoSize) {
      // Fallback to old method if actualVideoSize not available
      return {
        x: (percentX / 100) * displaySize!.width,
        y: (percentY / 100) * displaySize!.height,
      };
    }

    return {
      x: actualVideoSize.offsetX + (percentX / 100) * actualVideoSize.width,
      y: actualVideoSize.offsetY + (percentY / 100) * actualVideoSize.height,
    };
  };

  const createShape = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    shape: string
  ) => {
    const startScreen = percentageToScreen(start.x, start.y);
    const endScreen = percentageToScreen(end.x, end.y);

    switch (shape) {
      case "line":
        return `M ${startScreen.x} ${startScreen.y} L ${endScreen.x} ${endScreen.y}`;

      case "circle":
        const width = endScreen.x - startScreen.x;
        const height = endScreen.y - startScreen.y;
        const centerX = startScreen.x + width / 2;
        const centerY = startScreen.y + height / 2;
        const radiusX = Math.abs(width) / 2;
        const radiusY = Math.abs(height) / 2;
        return `M ${centerX - radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY}`;

      case "square":
        const squareWidth = endScreen.x - startScreen.x;
        const squareHeight = endScreen.y - startScreen.y;
        return `M ${startScreen.x} ${startScreen.y} L ${startScreen.x + squareWidth} ${startScreen.y} L ${startScreen.x + squareWidth} ${startScreen.y + squareHeight} L ${startScreen.x} ${startScreen.y + squareHeight} Z`;

      case "arrow":
        const arrowLength = Math.sqrt(
          Math.pow(endScreen.x - startScreen.x, 2) +
            Math.pow(endScreen.y - startScreen.y, 2)
        );
        const angle = Math.atan2(
          endScreen.y - startScreen.y,
          endScreen.x - startScreen.x
        );
        const arrowHeadLength = Math.min(arrowLength * 0.3, 20);
        const arrowHeadAngle = Math.PI / 6;

        const arrowHead1X =
          endScreen.x - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
        const arrowHead1Y =
          endScreen.y - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
        const arrowHead2X =
          endScreen.x - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
        const arrowHead2Y =
          endScreen.y - arrowHeadLength * Math.sin(angle + arrowHeadAngle);

        return `M ${startScreen.x} ${startScreen.y} L ${endScreen.x} ${endScreen.y} M ${endScreen.x} ${endScreen.y} L ${arrowHead1X} ${arrowHead1Y} M ${endScreen.x} ${endScreen.y} L ${arrowHead2X} ${arrowHead2Y}`;

      default:
        return `M ${startScreen.x} ${startScreen.y} L ${endScreen.x} ${endScreen.y}`;
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isActive || !mediaDimensions || !displaySize) return;

    event.preventDefault();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // ✅ CHECK IF CLICK IS WITHIN ACTUAL VIDEO BOUNDS
    if (actualVideoSize) {
      if (
        x < actualVideoSize.offsetX ||
        x > actualVideoSize.offsetX + actualVideoSize.width ||
        y < actualVideoSize.offsetY ||
        y > actualVideoSize.offsetY + actualVideoSize.height
      ) {
        return; // Click outside video area
      }
    }

    setIsDrawing(true);

    const percentagePoint = screenToPercentage(x, y);

    if (!currentDrawing) {
      const newDrawing: DrawingAnnotation = {
        id: `drawing_${Date.now()}`,
        strokes: [],
        timestamp: currentTime,
        mediaWidth: mediaDimensions.width,
        mediaHeight: mediaDimensions.height,
        createdAtScale: getCurrentScale(),
      };
      setCurrentDrawing(newDrawing);
    }

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}`,
      points: [percentagePoint],
      color: color,
      thickness: thickness,
      shape: shape,
      timestamp: currentTime,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: getCurrentScale(),
    };

    if (shape !== "freehand") {
      setStartPoint(percentagePoint);
    }

    setCurrentStroke(newStroke);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !currentStroke || !displaySize) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const percentagePoint = screenToPercentage(x, y);

    if (shape === "freehand") {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, percentagePoint],
      });
    } else if (startPoint) {
      setCurrentStroke({
        ...currentStroke,
        points: [startPoint, percentagePoint],
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke || !currentDrawing) return;

    setIsDrawing(false);
    const updatedDrawing = {
      ...currentDrawing,
      strokes: [...currentDrawing.strokes, currentStroke],
    };

    setCurrentDrawing(updatedDrawing);
    setCurrentStroke(null);
    setStartPoint(null);

    // Notify the comments component of the updated drawing
    if (
      typeof window !== "undefined" &&
      (window as any).handleAnnotationComplete
    ) {
      (window as any).handleAnnotationComplete({
        type: "drawing",
        data: updatedDrawing,
      });
    }
  };

  const createPath = (stroke: DrawingStroke) => {
    if (stroke.points.length < 1) return "";

    if (stroke.shape === "freehand") {
      if (stroke.points.length < 2) return "";
      const screenPoints = stroke.points.map((p) =>
        percentageToScreen(p.x, p.y)
      );
      let path = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
      for (let i = 1; i < screenPoints.length; i++) {
        path += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
      }
      return path;
    } else if (stroke.points.length === 2) {
      return createShape(
        stroke.points[0],
        stroke.points[1],
        stroke.shape || "line"
      );
    }
    return "";
  };
  useEffect(() => {
    if (!isActive) return;

    const element = document.querySelector(
      '[data-drawing-overlay="true"]'
    ) as HTMLElement;
    if (!element) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (!isActive || !mediaDimensions || !displaySize) return;

      event.preventDefault();
      event.stopPropagation();

      const touch = event.touches[0];
      const rect = element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check if touch is within actual video bounds
      if (actualVideoSize) {
        if (
          x < actualVideoSize.offsetX ||
          x > actualVideoSize.offsetX + actualVideoSize.width ||
          y < actualVideoSize.offsetY ||
          y > actualVideoSize.offsetY + actualVideoSize.height
        ) {
          return; // Touch outside video area
        }
      }

      setIsDrawing(true);

      const percentagePoint = screenToPercentage(x, y);

      if (!currentDrawing) {
        const newDrawing: DrawingAnnotation = {
          id: `drawing_${Date.now()}`,
          strokes: [],
          timestamp: currentTime,
          mediaWidth: mediaDimensions.width,
          mediaHeight: mediaDimensions.height,
          createdAtScale: getCurrentScale(),
        };
        setCurrentDrawing(newDrawing);
      }

      const newStroke: DrawingStroke = {
        id: `stroke_${Date.now()}`,
        points: [percentagePoint],
        color: color,
        thickness: thickness,
        shape: shape,
        timestamp: currentTime,
        mediaWidth: mediaDimensions.width,
        mediaHeight: mediaDimensions.height,
        createdAtScale: getCurrentScale(),
      };

      if (shape !== "freehand") {
        setStartPoint(percentagePoint);
      }

      setCurrentStroke(newStroke);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDrawing || !currentStroke || !displaySize) return;

      event.preventDefault();
      event.stopPropagation();

      const touch = event.touches[0];
      const rect = element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const percentagePoint = screenToPercentage(x, y);

      if (shape === "freehand") {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, percentagePoint],
        });
      } else if (startPoint) {
        setCurrentStroke({
          ...currentStroke,
          points: [startPoint, percentagePoint],
        });
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isDrawing || !currentStroke || !currentDrawing) return;

      event.preventDefault();
      event.stopPropagation();

      setIsDrawing(false);
      const updatedDrawing = {
        ...currentDrawing,
        strokes: [...currentDrawing.strokes, currentStroke],
      };

      setCurrentDrawing(updatedDrawing);
      setCurrentStroke(null);
      setStartPoint(null);

      // Notify the comments component of the updated drawing
      if (
        typeof window !== "undefined" &&
        (window as any).handleAnnotationComplete
      ) {
        (window as any).handleAnnotationComplete({
          type: "drawing",
          data: updatedDrawing,
        });
      }
    };

    // Add event listeners with passive: false
    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isActive,
    isDrawing,
    currentStroke,
    currentDrawing,
    mediaDimensions,
    displaySize,
    actualVideoSize,
    color,
    thickness,
    shape,
    currentTime,
    startPoint,
  ]);
  return (
    <>
      {mediaElementRef.current && (
        <div
          data-drawing-overlay="true" // ✅ ADD THIS ATTRIBUTE
          className="absolute z-10"
          style={{
            left: `${displayPosition.left}px`,
            top: `${displayPosition.top}px`,
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            cursor: isActive ? "crosshair" : "default",
            pointerEvents: isActive ? "auto" : "none",
            touchAction: isActive ? "none" : "auto", // ✅ ADD THIS TOO
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
          >
            {/* Existing drawings */}
            {drawings.map((drawing) => {
              const scaleFactor = getDrawingScaleFactor(drawing);
              return (
                <g key={drawing.id}>
                  {drawing.strokes.map((stroke) => (
                    <path
                      key={stroke.id}
                      d={createPath(stroke)}
                      stroke={stroke.color}
                      strokeWidth={
                        stroke.thickness * Math.max(scaleFactor, 0.3)
                      }
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              );
            })}

            {/* Current drawing strokes */}
            {currentDrawing && (
              <g>
                {currentDrawing.strokes.map((stroke) => (
                  <path
                    key={stroke.id}
                    d={createPath(stroke)}
                    stroke={stroke.color}
                    strokeWidth={stroke.thickness}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            )}

            {/* Current stroke being drawn */}
            {currentStroke && (
              <path
                d={createPath(currentStroke)}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.thickness}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      )}
    </>
  );
};