// components/ui/SplitPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubbleOvalLeftIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/solid";

interface SplitPanelProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultRightPanelWidth?: number;
  minRightPanelWidth?: number;
  maxRightPanelWidth?: number;
  showRightPanel?: boolean;
  onRightPanelToggle?: (isOpen: boolean) => void;
  rightPanelTitle?: string;
  leftPanelTitle?: string;
  allowCloseRight?: boolean; // Whether the right panel can be closed
  allowCloseLeft?: boolean; // Whether the left panel can be closed
  showLeftPanel?: boolean;
  onLeftPanelToggle?: (isOpen: boolean) => void;
  defaultLeftPanelWidth?: number;
  className?: string;
  mode?: "review" | "project" | "flexible"; // Different modes for different use cases
}

export const SplitPanel: React.FC<SplitPanelProps> = ({
  leftPanel,
  rightPanel,
  defaultRightPanelWidth = 400,
  minRightPanelWidth = 300,
  maxRightPanelWidth = 800,
  showRightPanel = true,
  onRightPanelToggle,
  rightPanelTitle = "Comments",
  leftPanelTitle = "Media",
  allowCloseRight = true,
  allowCloseLeft = false,
  showLeftPanel = true,
  onLeftPanelToggle,
  defaultLeftPanelWidth = 600,
  className = "",
  mode = "flexible",
}) => {
  const [rightPanelWidth, setRightPanelWidth] = useState(
    defaultRightPanelWidth
  );
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(showRightPanel);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(showLeftPanel);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update internal state when props change
  useEffect(() => {
    setIsRightPanelOpen(showRightPanel);
  }, [showRightPanel]);

  useEffect(() => {
    setIsLeftPanelOpen(showLeftPanel);
  }, [showLeftPanel]);

  // Handle panel toggles
  const handleRightPanelToggle = () => {
    if (!allowCloseRight) return;
    const newState = !isRightPanelOpen;
    setIsRightPanelOpen(newState);
    onRightPanelToggle?.(newState);
  };

  const handleLeftPanelToggle = () => {
    if (!allowCloseLeft) return;
    const newState = !isLeftPanelOpen;
    setIsLeftPanelOpen(newState);
    onLeftPanelToggle?.(newState);
  };

  // Resizing handlers for right panel
  const handleRightResizeMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isRightPanelOpen) return;
      setIsResizing(true);
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isRightPanelOpen]
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      e.preventDefault();
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.max(
        minRightPanelWidth,
        Math.min(
          maxRightPanelWidth,
          Math.min(newWidth, containerRect.width * 0.6)
        )
      );

      setRightPanelWidth(clampedWidth);
    },
    [isResizing, minRightPanelWidth, maxRightPanelWidth]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Calculate widths based on what panels are open
  const getLeftPanelWidth = () => {
    if (!isLeftPanelOpen) return "0px";
    if (!isRightPanelOpen) return "100%";
    return `calc(100% - ${rightPanelWidth}px)`;
  };

  const getRightPanelWidth = () => {
    if (!isRightPanelOpen) return "0px";
    return `${rightPanelWidth}px`;
  };

  return (
    <div
      ref={containerRef}
      className={`flex h-full min-h-0 relative   ${className}`}
    >
      {/* Left Panel */}
      <div style={{ width: getLeftPanelWidth() }}>{leftPanel}</div>

      {/* Left Panel Toggle Button (when panel is closed) */}
      {!isLeftPanelOpen && allowCloseLeft && (
        <div className="absolute left-4 top-4 z-50">
          <Button
            onClick={handleLeftPanelToggle}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
          >
            <PlayCircleIcon className="h-4 w-4 mr-1" />
            {leftPanelTitle}
          </Button>
        </div>
      )}

      {/* Resize Handle */}
      {isRightPanelOpen && isLeftPanelOpen && (
        <div
          className="w-1 bg-border hover:bg-muted-foreground/25 cursor-col-resize group relative select-none flex-shrink-0"
          onMouseDown={handleRightResizeMouseDown}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-muted-foreground/60 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Right Panel */}
      <div
        className={`flex flex-col transition-all duration-200 p-3 min-h-full ${
          isRightPanelOpen ? "flex-shrink-0" : "hidden"
        }`}
        style={{ width: getRightPanelWidth() }}
      >
        <div className=" bg-primary-foreground/35 border rounded-2xl flex flex-col transition-all duration-200 min-h-full">
          {/* Right Panel Header */}
          <div className="flex items-center  justify-between px-4 py-1 border-b border-[#262626]">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ChatBubbleOvalLeftIcon className="h-4 w-4" />
              {rightPanelTitle}
            </h3>
            {allowCloseRight && (
              <Button
                onClick={handleRightPanelToggle}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 min-h-0">{rightPanel}</div>
        </div>
      </div>
      {/* Right Panel Toggle Button (when panel is closed) */}
      {!isRightPanelOpen && allowCloseRight && (
        <div className="absolute right-4 top-4 z-50">
          <Button
            onClick={handleRightPanelToggle}
            size="sm"
            className="rounded-full"
          >
            <ChatBubbleOvalLeftIcon className="h-4 w-4 " /> {rightPanelTitle}
          </Button>
        </div>
      )}
    </div>
  );
};
