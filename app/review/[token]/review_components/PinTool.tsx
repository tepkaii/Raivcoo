"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";

interface AnnotationPin {
  id: string;
  x: number; // Percentage relative to media (0-100)
  y: number; // Percentage relative to media (0-100)
  timestamp?: number; // For videos
  content: string;
  mediaWidth: number; // Original media width when pin was created
  mediaHeight: number; // Original media height when pin was created
  createdAtScale: number; // Scale percentage when pin was created
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
  const [annotationPins, setAnnotationPins] =
    useState<AnnotationPin[]>(existingPins);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<AnnotationPin | null>(null);

  // Update existing pins when prop changes
  useEffect(() => {
    setAnnotationPins(existingPins);
  }, [existingPins]);

  if (!displaySize || !displayPosition || !mediaDimensions) return null;

  // Calculate current scale percentage
  const getCurrentScale = () => {
    if (!mediaDimensions || !displaySize) return 100;

    const scaleX = displaySize.width / mediaDimensions.width;
    const scaleY = displaySize.height / mediaDimensions.height;
    const scale = Math.min(scaleX, scaleY);

    return Math.round(scale * 100);
  };

  // Calculate pin scale factor (SAME as drawings)
  const getPinScaleFactor = (pin: AnnotationPin) => {
    const currentScale = getCurrentScale();
    return currentScale / pin.createdAtScale; // Always scale proportionally
  };

  // Handle click to add pin
  const handleClick = (event: React.MouseEvent) => {
    if (!isActive || !mediaDimensions || !displaySize || !displayPosition)
      return;

    // Get the media element's bounding rect directly
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

    const currentScaleValue = getCurrentScale();

    const newPin: AnnotationPin = {
      id: `pin_${Date.now()}`,
      x: percentageX,
      y: percentageY,
      content: `Pin at ${Math.round(percentageX)}%, ${Math.round(percentageY)}%`,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: currentScaleValue,
      timestamp: currentTime,
    };

    setPendingPin(newPin);
    setAnnotationPins((prev) => [...prev, newPin]);
    setSelectedPin(newPin.id);
  };

  // Remove pin
  const removePin = (pinId: string) => {
    setAnnotationPins((prev) => prev.filter((pin) => pin.id !== pinId));
    if (selectedPin === pinId) {
      setSelectedPin(null);
    }
    if (pendingPin?.id === pinId) {
      setPendingPin(null);
    }
  };

  // Save the current pending pin
  const handleSavePin = () => {
    if (pendingPin && onPinComplete) {
      onPinComplete(pendingPin);
      setPendingPin(null);
      setSelectedPin(null);
    }
  };

  // Clear all pins
  const handleClearAll = () => {
    setAnnotationPins([]);
    setSelectedPin(null);
    setPendingPin(null);
  };

  return (
    <>
      {/* Pin Controls - Only show when active */}
      {isActive && (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 space-y-2">
            <Badge
              variant="secondary"
              className="w-full text-center bg-purple-600/70"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Pin Mode Active
            </Badge>

            {annotationPins.length > 0 && (
              <div className="text-xs text-gray-300 text-center">
                {annotationPins.length} pin
                {annotationPins.length !== 1 ? "s" : ""} placed
              </div>
            )}

            <div className="flex gap-1">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-gray-700 flex-1"
                onClick={handleClearAll}
              >
                Clear All
              </Badge>
              {pendingPin && (
                <Badge
                  variant="default"
                  className="cursor-pointer hover:bg-blue-700 flex-1 bg-blue-600"
                  onClick={handleSavePin}
                >
                  Save Pin
                </Badge>
              )}
            </div>

            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-red-700 w-full text-red-400"
              onClick={onCancel}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Badge>
          </div>
        </div>
      )}

      {/* Overlay that covers ONLY the media element area */}
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
          {/* Pins - Scale with media like drawings do */}
          {annotationPins.map((pin, index) => {
            // Calculate pin scale factor (SAME as drawings)
            const scaleFactor = getPinScaleFactor(pin);
            const minScale = 0.3; // Minimum pin size (same as drawings)
            const finalScale = Math.max(scaleFactor, minScale);

            return (
              <div
                key={pin.id}
                className="absolute group"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: `translate(-50%, -50%) scale(${finalScale})`, // Apply scaling like drawings
                  transformOrigin: "center",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                {/* Pin Icon */}
                <div
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedPin === pin.id ? "scale-125" : "hover:scale-110"
                  }`}
                  onClick={(e) => {
                    if (!isActive) return;
                    e.stopPropagation();
                    setSelectedPin(selectedPin === pin.id ? null : pin.id);
                  }}
                >
                  <MapPin
                    className="w-6 h-6 text-red-500 drop-shadow-lg"
                    fill="currentColor"
                  />

                  {/* Pin number */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 bg-white text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                    {index + 1}
                  </div>
                </div>

                {/* Small position indicator - counter-scale to stay readable */}
                <div
                  className="absolute left-8 top-0 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap"
                  style={{
                    transform: `scale(${1 / finalScale})`, // Counter-scale text
                    transformOrigin: "left center",
                  }}
                >
                  {Math.round(pin.x)}%, {Math.round(pin.y)}%
                </div>

                {/* Remove button - counter-scale to stay usable */}
                {isActive && selectedPin === pin.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePin(pin.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    style={{
                      transform: `scale(${1 / finalScale})`, // Counter-scale button
                      transformOrigin: "center",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions - Only show when active */}
      {isActive && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <Badge
            variant="outline"
            className="bg-black/70 text-white text-xs border border-gray-600"
          >
            Click anywhere on media to add a pin
          </Badge>
        </div>
      )}
    </>
  );
};