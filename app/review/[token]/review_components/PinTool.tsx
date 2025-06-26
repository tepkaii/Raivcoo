// app/review/[token]/review_components/PinTool.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";

interface AnnotationPin {
  id: string;
  x: number;
  y: number;
  timestamp?: number;
  content: string;
  mediaWidth: number;
  mediaHeight: number;
  createdAtScale: number;
  color: string;
}

interface PinToolProps {
  isActive: boolean;
  displaySize: { width: number; height: number } | null;
  displayPosition: { left: number; top: number } | null;
  mediaDimensions: { width: number; height: number } | null;
  currentTime?: number;
  currentScale: number;
  onPinComplete?: (pin: AnnotationPin) => void;
  onCancel?: () => void;
  existingPins?: AnnotationPin[];
  mediaElementRef: React.RefObject<HTMLVideoElement | HTMLImageElement>;
}

export const PinTool: React.FC<PinToolProps> = ({
  isActive,
  displaySize,
  displayPosition,
  mediaDimensions,
  currentTime,
  currentScale,
  onPinComplete,
  onCancel,
  existingPins = [],
  mediaElementRef,
}) => {
  const [currentPin, setCurrentPin] = useState<AnnotationPin | null>(null);
  const [selectedColor, setSelectedColor] = useState("#ff0000");

  useEffect(() => {
    if (existingPins.length > 0) {
      setCurrentPin(existingPins[0]);
    }
  }, [existingPins]);

  if (!displaySize || !displayPosition || !mediaDimensions) return null;

  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;
    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.round(scale * 100);
  };

  const getPinScaleFactor = (pin: AnnotationPin) => {
    const currentScale = getCurrentScale();
    return Math.max(currentScale / pin.createdAtScale, 0.3);
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!isActive || !mediaDimensions || !displaySize || !displayPosition)
      return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const percentageX = (clickX / displaySize.width) * 100;
    const percentageY = (clickY / displaySize.height) * 100;

    if (
      percentageX < 0 ||
      percentageX > 100 ||
      percentageY < 0 ||
      percentageY > 100
    ) {
      return;
    }

    const newPin: AnnotationPin = {
      id: `pin_${Date.now()}`,
      x: percentageX,
      y: percentageY,
      content: `Pin at ${Math.round(percentageX)}%, ${Math.round(percentageY)}%`,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: getCurrentScale(),
      timestamp: currentTime,
      color: selectedColor,
    };

    setCurrentPin(newPin);
  };

  const handleSavePin = () => {
    if (currentPin && onPinComplete) {
      onPinComplete(currentPin);
      setCurrentPin(null);
    }
  };

  const handleCancel = () => {
    setCurrentPin(null);
    if (onCancel) onCancel();
  };

  // 5 colors as requested
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

  return (
    <>
      {/* Compact Pin Controls */}
      {isActive && (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 space-y-2 w-40">
            <Badge
              variant="secondary"
              className="w-full text-center bg-purple-600/70 text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Pin Mode
            </Badge>

            {/* Color selection - 5 colors */}
            <div className="flex justify-center gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-4 h-4 rounded border ${
                    selectedColor === color
                      ? "border-white border-2"
                      : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {currentPin && (
                <button
                  onClick={handleSavePin}
                  className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
                >
                  Save
                </button>
              )}
              <button
                onClick={handleCancel}
                className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin overlay */}
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
          onClick={handleClick}
        >
          {/* Current pin */}
          {currentPin && (
            <div
              className="absolute"
              style={{
                left: `${currentPin.x}%`,
                top: `${currentPin.y}%`,
                transform: `translate(-50%, -50%) scale(${getPinScaleFactor(currentPin)})`,
                transformOrigin: "center",
                pointerEvents: "none",
              }}
            >
              <MapPin
                className="w-6 h-6 drop-shadow-lg"
                style={{ color: currentPin.color }}
                fill="currentColor"
              />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 bg-white text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                1
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isActive && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <Badge
            variant="outline"
            className="bg-black/70 text-white text-xs border border-gray-600"
          >
            Click to place pin
          </Badge>
        </div>
      )}
    </>
  );
};
