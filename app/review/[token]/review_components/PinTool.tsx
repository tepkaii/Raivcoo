"use client";

import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

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
}) => {
  const [currentPin, setCurrentPin] = useState<AnnotationPin | null>(null);

  useEffect(() => {
    if (existingPins.length > 0) {
      setCurrentPin(existingPins[0]);
    } else {
      setCurrentPin(null);
    }
  }, [existingPins]);

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
    console.log("PinTool isActive changed:", isActive); // Debug log

    if (!isActive) {
      console.log("PinTool becoming inactive, clearing current pin"); // Debug log
      setCurrentPin(null);
    }
  }, [isActive]);

  // Also add this useEffect to clear when existingPins change

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
    </>
  );
};
