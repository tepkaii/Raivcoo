// app/review/[token]/review_components/DrawingTool.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  X,
  Undo,
  Circle,
  Square,
  ArrowRight,
  Minus,
} from "lucide-react";

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
}) => {
  const [drawings, setDrawings] =
    useState<DrawingAnnotation[]>(existingDrawings);
  const [currentDrawing, setCurrentDrawing] =
    useState<DrawingAnnotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const [selectedThickness, setSelectedThickness] = useState(3);
  const [selectedShape, setSelectedShape] = useState<
    "freehand" | "line" | "circle" | "square" | "arrow"
  >("freehand");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setDrawings(existingDrawings);
  }, [existingDrawings]);

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

  const screenToPercentage = (screenX: number, screenY: number) => {
    return {
      x: (screenX / displaySize!.width) * 100,
      y: (screenY / displaySize!.height) * 100,
    };
  };

  const percentageToScreen = (percentX: number, percentY: number) => {
    return {
      x: (percentX / 100) * displaySize!.width,
      y: (percentY / 100) * displaySize!.height,
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
        // Calculate width and height like the square (can be different dimensions)
        const width = endScreen.x - startScreen.x;
        const height = endScreen.y - startScreen.y;

        // Center point of the ellipse
        const centerX = startScreen.x + width / 2;
        const centerY = startScreen.y + height / 2;

        // Radius for width and height (creates ellipse when different)
        const radiusX = Math.abs(width) / 2;
        const radiusY = Math.abs(height) / 2;

        // Draw ellipse using the bounding box dimensions
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
    setIsDrawing(true);

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
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
      color: selectedColor,
      thickness: selectedThickness,
      shape: selectedShape,
      timestamp: currentTime,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: getCurrentScale(),
    };

    if (selectedShape !== "freehand") {
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

    if (selectedShape === "freehand") {
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
  };

  const handleSaveDrawing = () => {
    if (currentDrawing && onDrawingComplete) {
      onDrawingComplete(currentDrawing);
      setCurrentDrawing(null);
      setCurrentStroke(null);
    }
  };

  const handleUndo = () => {
    if (currentDrawing && currentDrawing.strokes.length > 0) {
      const updatedDrawing = {
        ...currentDrawing,
        strokes: currentDrawing.strokes.slice(0, -1),
      };
      setCurrentDrawing(updatedDrawing);
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
      return createShape(stroke.points[0], stroke.points[1], stroke.shape);
    }
    return "";
  };

  const colors = ["#ff0000", "#00ff00", "#0000ff"];
  const thicknesses = [2, 4, 6];
  const shapes = [
    { value: "freehand", icon: Pencil, label: "Draw" },
    { value: "line", icon: Minus, label: "Line" },
    { value: "circle", icon: Circle, label: "Circle" },
    { value: "square", icon: Square, label: "Square" },
    { value: "arrow", icon: ArrowRight, label: "Arrow" },
  ] as const;

  return (
    <>
      {isActive && (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-2 min-w-48">
            <Badge
              variant="secondary"
              className="w-full text-center bg-green-600/70"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Draw Mode
            </Badge>

            {/* First Line: Colors and Thickness */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-5 h-5 rounded border ${
                      selectedColor === color
                        ? "border-white border-2"
                        : "border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                {thicknesses.map((thickness) => (
                  <button
                    key={thickness}
                    onClick={() => setSelectedThickness(thickness)}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedThickness === thickness
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {thickness}
                  </button>
                ))}
              </div>

              <button
                onClick={handleUndo}
                disabled={
                  !currentDrawing || currentDrawing.strokes.length === 0
                }
                className="p-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
              >
                <Undo className="w-3 h-3" />
              </button>
            </div>

            {/* Second Line: Shapes */}
            <div className="flex gap-1">
              {shapes.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedShape(value)}
                  className={`p-2 rounded text-xs flex items-center justify-center ${
                    selectedShape === value
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  title={value}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-1">
              {currentDrawing && currentDrawing.strokes.length > 0 && (
                <button
                  onClick={handleSaveDrawing}
                  className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  Save
                </button>
              )}
              <button
                onClick={onCancel}
                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>

            {currentDrawing && (
              <div className="text-xs text-gray-300 text-center">
                {currentDrawing.strokes.length} stroke
                {currentDrawing.strokes.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {mediaElementRef.current && (
        <div
          className="absolute z-10"
          style={{
            left: `${displayPosition.left}px`,
            top: `${displayPosition.top}px`,
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            cursor: isActive ? "crosshair" : "default",
            pointerEvents: isActive ? "auto" : "none",
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
