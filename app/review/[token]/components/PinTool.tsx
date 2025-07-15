"use client";

import React, { useState, useEffect } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";

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
  color?: string;
  actualVideoSize?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null;
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
  color = "#ff0000",
  actualVideoSize,
}) => {
  const [currentPin, setCurrentPin] = useState<AnnotationPin | null>(null);

  // REPLACE WITH THIS:
  useEffect(() => {
    if (existingPins.length > 0) {
      setCurrentPin(existingPins[0]);
    } else {
      setCurrentPin(null);
    }
  }, [existingPins.length, existingPins[0]?.id]);

  useEffect(() => {
    const clearCurrentPin = () => {
      setCurrentPin(null);
    };

    if (typeof window !== "undefined") {
      (window as any).clearCurrentPin = clearCurrentPin;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).clearCurrentPin;
      }
    };
  }, []);

  // Also clear when isActive becomes false
  useEffect(() => {
    if (!isActive) {
      setCurrentPin(null);
    }
  }, [isActive]);

  // NOW you can have conditional returns AFTER all hooks
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

  const handleClick = (event: React.MouseEvent) => {
    if (!isActive || !mediaDimensions || !displaySize || !displayPosition)
      return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // ✅ CHECK IF CLICK IS WITHIN ACTUAL VIDEO BOUNDS
    if (actualVideoSize) {
      if (
        clickX < actualVideoSize.offsetX ||
        clickX > actualVideoSize.offsetX + actualVideoSize.width ||
        clickY < actualVideoSize.offsetY ||
        clickY > actualVideoSize.offsetY + actualVideoSize.height
      ) {
        return; // Click outside video area
      }
    }

    const percentageCoords = screenToPercentage(clickX, clickY);

    const newPin: AnnotationPin = {
      id: `pin_${Date.now()}`,
      x: percentageCoords.x,
      y: percentageCoords.y,
      content: `Pin at ${Math.round(percentageCoords.x)}%, ${Math.round(percentageCoords.y)}%`,
      mediaWidth: mediaDimensions.width,
      mediaHeight: mediaDimensions.height,
      createdAtScale: getCurrentScale(),
      timestamp: currentTime,
      color: color,
    };

    setCurrentPin(newPin);

    // Notify the comments component that a pin is placed
    if (
      typeof window !== "undefined" &&
      (window as any).handleAnnotationComplete
    ) {
      (window as any).handleAnnotationComplete({
        type: "pin",
        data: newPin,
      });
    }
  };

  return (
    <>
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
                left: `${percentageToScreen(currentPin.x, currentPin.y).x}px`,
                top: `${percentageToScreen(currentPin.x, currentPin.y).y}px`,
                transform: `translate(-50%, -50%) scale(${getPinScaleFactor(currentPin)})`,
                transformOrigin: "center",
                pointerEvents: "none",
              }}
            >
              <MapPinIcon
                className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  color: currentPin.color,
                  fill: "currentColor",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};