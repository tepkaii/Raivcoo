// app/projects/[projectId]/review/[trackId]/components/MediaDialog.tsx
"use client";

import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, ZoomIn, ZoomOut } from "lucide-react";

interface MediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video" | "other";
  title?: string;
  setCurrentTime?: (time: number) => void;
}

export const MediaDialog: React.FC<MediaDialogProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
  setCurrentTime,
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);

  // For video time tracking
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || mediaType !== "video" || !setCurrentTime) return;

    const handleTimeUpdate = () => {
      if (videoElement && setCurrentTime) {
        setCurrentTime(videoElement.currentTime);
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [mediaType, setCurrentTime]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] p-1 sm:p-4">
        <DialogHeader className="flex-row justify-between items-center p-2">
          <DialogTitle className="text-lg">
            {title || "Media Preview"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {mediaType === "image" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono">{zoomLevel}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open Original
            </a>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-background/95 flex justify-center items-center">
          {mediaType === "image" ? (
            <div className="overflow-auto max-h-[calc(90vh-100px)] flex justify-center">
              <img
                src={mediaUrl}
                alt="Full preview"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          ) : mediaType === "video" ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[calc(90vh-100px)] max-w-full"
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="text-center p-4">
              <p>Cannot preview this media type directly.</p>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-2 inline-block"
              >
                View Original
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};