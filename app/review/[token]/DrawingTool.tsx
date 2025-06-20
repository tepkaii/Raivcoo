"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Pencil, X, Undo, Redo, Palette } from "lucide-react";

interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[]; // Percentage coordinates relative to media
  color: string;
  thickness: number;
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

  const svgRef = useRef<SVGSVGElement>(null);

  // Update existing drawings when prop changes
  useEffect(() => {
    setDrawings(existingDrawings);
  }, [existingDrawings]);

  if (!displaySize || !displayPosition || !mediaDimensions) return null;

  // Calculate current scale percentage
  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;
    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.round(scale * 100);
  };

  // Calculate drawing scale factor
  const getDrawingScaleFactor = (drawing: DrawingAnnotation) => {
    const currentScale = getCurrentScale();
    if (currentScale < drawing.createdAtScale) {
      return currentScale / drawing.createdAtScale;
    }
    return 1;
  };

  // Convert screen coordinates to percentage coordinates
  const screenToPercentage = (screenX: number, screenY: number) => {
    return {
      x: (screenX / displaySize!.width) * 100,
      y: (screenY / displaySize!.height) * 100,
    };
  };

  // Convert percentage coordinates to screen coordinates
  const percentageToScreen = (percentX: number, percentY: number) => {
    return {
      x: (percentX / 100) * displaySize!.width,
      y: (percentY / 100) * displaySize!.height,
    };
  };

  // Handle mouse down - start drawing
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isActive || !mediaDimensions || !displaySize) return;

    event.preventDefault();
    setIsDrawing(true);

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const percentagePoint = screenToPercentage(x, y);

    // Start new drawing if none exists
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

    // Start new stroke
    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}`,
      points: [percentagePoint],
      color: selectedColor,
      thickness: selectedThickness,
      timestamp: currentTime,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: getCurrentScale(),
    };

    setCurrentStroke(newStroke);
  };

  // Handle mouse move - continue drawing
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !currentStroke || !displaySize) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const percentagePoint = screenToPercentage(x, y);

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, percentagePoint],
    });
  };

  // Handle mouse up - finish stroke
  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke || !currentDrawing) return;

    setIsDrawing(false);

    // Add completed stroke to current drawing
    const updatedDrawing = {
      ...currentDrawing,
      strokes: [...currentDrawing.strokes, currentStroke],
    };

    setCurrentDrawing(updatedDrawing);
    setCurrentStroke(null);
  };

  // Save current drawing
  const handleSaveDrawing = () => {
    if (currentDrawing && onDrawingComplete) {
      onDrawingComplete(currentDrawing);
      setCurrentDrawing(null);
      setCurrentStroke(null);
    }
  };

  // Clear current drawing
  const handleClearCurrent = () => {
    setCurrentDrawing(null);
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  // Clear all drawings
  const handleClearAll = () => {
    setDrawings([]);
    setCurrentDrawing(null);
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (currentDrawing && currentDrawing.strokes.length > 0) {
      const updatedDrawing = {
        ...currentDrawing,
        strokes: currentDrawing.strokes.slice(0, -1),
      };
      setCurrentDrawing(updatedDrawing);
    }
  };

  // Create SVG path from points
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    const screenPoints = points.map((p) => percentageToScreen(p.x, p.y));

    let path = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
    for (let i = 1; i < screenPoints.length; i++) {
      path += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
    }
    return path;
  };

  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#000000",
    "#ffffff",
  ];

  return (
    <>
      {/* Draw Controls */}
      {isActive && (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-3 min-w-48">
            <Badge
              variant="secondary"
              className="w-full text-center bg-green-600/70"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Draw Mode Active
            </Badge>

            {/* Color Palette */}
            <div>
              <div className="text-xs text-gray-300 mb-2">Color:</div>
              <div className="flex flex-wrap gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded border-2 ${
                      selectedColor === color
                        ? "border-white"
                        : "border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Thickness */}
            <div>
              <div className="text-xs text-gray-300 mb-2">Thickness:</div>
              <div className="flex gap-1">
                {[1, 3, 5, 8].map((thickness) => (
                  <button
                    key={thickness}
                    onClick={() => setSelectedThickness(thickness)}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedThickness === thickness
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {thickness}px
                  </button>
                ))}
              </div>
            </div>

            {/* Drawing Info */}
            {currentDrawing && (
              <div className="text-xs text-gray-300 text-center">
                {currentDrawing.strokes.length} stroke
                {currentDrawing.strokes.length !== 1 ? "s" : ""}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-1">
              {currentDrawing && (
                <div className="flex gap-1">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-700 flex-1 text-center"
                    onClick={handleUndo}
                  >
                    <Undo className="w-3 h-3 mr-1" />
                    Undo
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-700 flex-1 text-center"
                    onClick={handleClearCurrent}
                  >
                    Clear
                  </Badge>
                </div>
              )}

              <div className="flex gap-1">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-700 flex-1 text-center"
                  onClick={handleClearAll}
                >
                  Clear All
                </Badge>
                {currentDrawing && currentDrawing.strokes.length > 0 && (
                  <Badge
                    variant="default"
                    className="cursor-pointer hover:bg-green-700 flex-1 bg-green-600 text-center"
                    onClick={handleSaveDrawing}
                  >
                    Save
                  </Badge>
                )}
              </div>

              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-red-700 w-full text-red-400 text-center"
                onClick={onCancel}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Canvas Overlay */}
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
          {/* SVG Canvas for drawings */}
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
                      d={createPath(stroke.points)}
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
                    d={createPath(stroke.points)}
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
                d={createPath(currentStroke.points)}
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

      {/* Instructions */}
      {isActive && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <Badge
            variant="outline"
            className="bg-black/70 text-white text-xs border border-gray-600"
          >
            Click and drag to draw on media
          </Badge>
        </div>
      )}
    </>
  );
};
