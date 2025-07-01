// app/review/[token]/MediaInterface.tsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ReviewComments } from "./review_components/ReviewComments";
import { VersionSelector } from "./review_components/VersionSelector";
import { MediaDisplay } from "./review_components/MediaDisplay";
import { PlayerControls } from "./review_components/PlayerControls";
import { SplitPanel } from "@/app/components/SplitPanel";
import { getCommentsAction, updateMediaStatusAction } from "./lib/actions";
import { MediaFile } from "@/app/dashboard/lib/types";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";
import { Download } from "lucide-react"; // ✅ ADD DOWNLOAD ICON
import { Button } from "@/components/ui/button"; // ✅ ADD BUTTON COMPONENT
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Status configuration - matches the project workspace
export const MEDIA_STATUS_OPTIONS = [
  { value: "on_hold", label: "On Hold", color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "needs_review", label: "Needs Review", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
] as const;

export const getStatusConfig = (status: string) => {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status) || {
      value: status,
      label: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "bg-gray-500",
    }
  );
};

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  annotation_data?: {
    id: string;
    x: number;
    y: number;
    mediaWidth: number;
    mediaHeight: number;
    createdAtScale: number;
    timestamp?: number;
    color?: string;
  };
  drawing_data?: {
    id: string;
    strokes: Array<{
      id: string;
      points: Array<{ x: number; y: number }>;
      color: string;
      thickness: number;
      timestamp?: number;
      mediaWidth: number;
      mediaHeight: number;
      createdAtScale: number;
    }>;
    timestamp?: number;
    mediaWidth: number;
    mediaHeight: number;
    createdAtScale: number;
  };
}

interface MediaInterface {
  media: MediaFile;
  allVersions?: MediaFile[];
  authenticatedUser?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  } | null;
  reviewTitle?: string;
  projectName?: string;
  allowDownload?: boolean; // ✅ ADD DOWNLOAD PERMISSION PROP
}

export const MediaInterface: React.FC<MediaInterface> = ({
  media,
  allVersions = [],
  authenticatedUser,
  reviewTitle,
  projectName,
  allowDownload = false, // ✅ DEFAULT TO FALSE FOR SECURITY
}) => {
  // States
  const [currentMedia, setCurrentMedia] = useState<MediaFile>(media);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [activeCommentPin, setActiveCommentPin] = useState<string | null>(null);
  const [activeCommentDrawing, setActiveCommentDrawing] = useState<
    string | null
  >(null);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Annotation states
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "pin" | "drawing"
  >("none");
  const [annotationConfig, setAnnotationConfig] = useState<any>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // ✅ DOWNLOAD HANDLER
  const handleDownload = useCallback(
    async (mediaFile: MediaFile) => {
      if (!allowDownload) {
        toast({
          title: "Download Disabled",
          description: "Downloads are not allowed for this review link",
          variant: "destructive",
        });
        return;
      }

      try {
        toast({
          title: "Starting Download",
          description: `Downloading ${mediaFile.original_filename}...`,
          variant: "default",
        });

        // Fetch the file as blob
        const response = await fetch(mediaFile.r2_url);

        if (!response.ok) {
          throw new Error("Download failed");
        }

        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = mediaFile.original_filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Download Complete",
          description: `${mediaFile.original_filename} has been downloaded`,
          variant: "green",
        });
      } catch (error) {
        console.error("Download failed:", error);
        toast({
          title: "Download Failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        });
      }
    },
    [allowDownload]
  );

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load comments when media changes
  useEffect(() => {
    loadComments();
  }, [currentMedia.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const loadComments = async () => {
    try {
      const result = await getCommentsAction(currentMedia.id);
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);

    try {
      const result = await updateMediaStatusAction(currentMedia.id, newStatus);

      if (result.success) {
        // Update local state
        setCurrentMedia((prev) => ({ ...prev, status: newStatus }));

        toast({
          title: "Status Updated",
          description: `Media status changed to ${getStatusConfig(newStatus).label}`,
          variant: "teal",
        });
      } else {
        toast({
          title: "Failed to Update Status",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update media status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // FIXED: Memoize the annotation request handler
  const handleAnnotationRequest = useCallback(
    (type: "pin" | "drawing" | "none", config: any) => {
      console.log("MediaInterface annotation request:", type, config);

      // Clear any active comment pins/drawings when starting new annotation OR canceling
      if (type !== "none") {
        console.log("Clearing active comments for new annotation");
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      }

      if (type === "none") {
        console.log("Canceling annotation mode");
        // Cancel annotation mode
        setAnnotationMode("none");
        setAnnotationConfig({});
        // Also clear active comments when canceling
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      } else {
        console.log("Setting annotation mode:", type);
        // Set annotation mode and config
        setAnnotationMode(type);
        setAnnotationConfig(config);
      }
    },
    []
  );

  const handleAnnotationComplete = (annotationData: any) => {
    // Reset annotation mode
    setAnnotationMode("none");
    setAnnotationConfig({});
  };

  const handleCommentDrawingClick = useCallback(
    (comment: MediaComment) => {
      if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
        // If this drawing is already active, hide it (toggle off)
        if (activeCommentDrawing === comment.id) {
          setActiveCommentDrawing(null);
          return;
        }

        // Otherwise show this drawing
        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentDrawing(comment.id);
      }
    },
    [activeCommentDrawing]
  );

  const clearActiveComments = useCallback(() => {
    setActiveCommentPin(null);
    setActiveCommentDrawing(null);
  }, []);

  useEffect(() => {
    if (activeCommentDrawing && videoRef.current) {
      const activeComment = comments.find((c) => c.id === activeCommentDrawing);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        if (timeDiff > 2 && !videoRef.current.paused) {
          setActiveCommentDrawing(null);
        }
      }
    }
  }, [currentTime, activeCommentDrawing, comments]);

  const handleCommentAdded = useCallback((newComment: MediaComment) => {
    setComments((prev) => [...prev, newComment]);
  }, []);

  const handleCommentPinClick = useCallback(
    (comment: MediaComment) => {
      if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
        // If this pin is already active, hide it (toggle off)
        if (activeCommentPin === comment.id) {
          setActiveCommentPin(null);
          return;
        }

        // Otherwise show this pin
        handleSeekToTimestamp(comment.timestamp_seconds);
        setActiveCommentPin(comment.id);
      }
    },
    [activeCommentPin]
  );

  useEffect(() => {
    if (activeCommentPin && videoRef.current) {
      const activeComment = comments.find((c) => c.id === activeCommentPin);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        if (timeDiff > 2 && !videoRef.current.paused) {
          setActiveCommentPin(null);
        }
      }
    }
  }, [currentTime, activeCommentPin, comments]);

  const handleVersionChange = (version: MediaFile) => {
    setCurrentMedia(version);
  };

  const handleSeekToTimestamp = useCallback(
    (timestamp: number) => {
      if (videoRef.current && currentMedia.file_type === "video") {
        videoRef.current.currentTime = timestamp;
      }
    },
    [currentMedia.file_type]
  );

  const handleCommentDeleted = useCallback((deletedCommentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedCommentId));
  }, []);

  // Create the main media content - THIS STAYS MOUNTED
  const mediaContent = (
    <div
      ref={fullscreenContainerRef}
      className={`flex flex-col h-full ${isFullscreen ? "bg-black relative" : ""}`}
    >
      <div
        className={`${isFullscreen ? "absolute inset-0" : "flex-1 min-h-0"}`}
      >
        <MediaDisplay
          media={currentMedia}
          videoRef={videoRef}
          className="h-full"
          onAnnotationComplete={handleAnnotationComplete}
          activeCommentPin={activeCommentPin}
          activeCommentDrawing={activeCommentDrawing}
          comments={comments}
          currentTime={currentTime}
          annotationMode={annotationMode}
          annotationConfig={annotationConfig}
          allowDownload={allowDownload} // ✅ PASS DOWNLOAD PERMISSION
        />
      </div>

      <PlayerControls
        videoRef={videoRef}
        mediaType={currentMedia.file_type}
        comments={comments}
        onSeekToTimestamp={handleSeekToTimestamp}
        onTimeUpdate={setCurrentTime}
        fullscreenContainerRef={fullscreenContainerRef}
        className={isFullscreen ? "absolute bottom-0 left-0 right-0 z-50" : ""}
      />
    </div>
  );

  const commentsContent = (
    <ReviewComments
      mediaId={currentMedia.id}
      mediaType={currentMedia.file_type}
      currentTime={currentTime}
      onSeekToTimestamp={handleSeekToTimestamp}
      className="h-full"
      onCommentPinClick={handleCommentPinClick}
      onCommentDrawingClick={handleCommentDrawingClick}
      onCommentDeleted={handleCommentDeleted}
      onCommentAdded={handleCommentAdded}
      onAnnotationRequest={handleAnnotationRequest}
      onClearActiveComments={clearActiveComments}
      authenticatedUser={authenticatedUser}
      activeCommentPin={activeCommentPin}
      activeCommentDrawing={activeCommentDrawing}
    />
  );

  // SINGLE LAYOUT that adapts with CSS and conditional rendering
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - adapts for mobile/desktop */}
      <header className="bg-background border-b px-3 md:px-4 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <h1
            className="text-base md:text-lg font-medium text-white truncate max-w-[200px]"
            title={currentMedia.original_filename}
          >
            {currentMedia.original_filename}
          </h1>

          {/* Version Selector */}
          <div className="flex items-center mr-2">
            <VersionSelector
              currentMedia={currentMedia}
              allVersions={allVersions}
              onVersionChange={handleVersionChange}
            />

            {/* ✅ DOWNLOAD BUTTON - Desktop */}
            {!isMobile && (
              <div className="border-l mr-l flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(currentMedia)}
                  disabled={!allowDownload}
                  className="ml-2"
                  title={
                    allowDownload
                      ? "Download this file"
                      : "Downloads are disabled for this review"
                  }
                >
                  <Download className="h-4 w-4 " />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status Selector - Desktop Only */}
        <div className="hidden md:block">
          <div className="flex justify-end items-center gap-2">
            <p className="text-xs text-muted-foreground">Status:</p>
            <Select
              value={currentMedia.status || "in_progress"}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          // MOBILE LAYOUT
          <div className="flex flex-col h-full">
            {/* Mobile Media Area */}
            <div className="h-[40vh] flex-shrink-0">{mediaContent}</div>

            {/* Mobile Controls Row */}
            <div className="border-t border-b px-4 py-2 gap-2 flex-shrink-0 flex items-center justify-between">
              {/* Status Selector */}
              <div className="flex items-center gap-2 flex-1">
                <h3 className="text-xs text-muted-foreground">Status:</h3>
                <Select
                  value={currentMedia.status || "in_progress"}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${option.color}`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ DOWNLOAD BUTTON - Mobile */}
              <div className="border-l mr-l flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(currentMedia)}
                  disabled={!allowDownload}
                  className="ml-2"
                  title={
                    allowDownload
                      ? "Download this file"
                      : "Downloads are disabled for this review"
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Comments Area */}
            <div className="flex-1 min-h-0 flex flex-col border-t border">
              {/* Mobile Comments Header */}
              <div className="border-b px-4 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                  Comments
                </h3>
              </div>

              {/* Mobile Comments Content */}
              <div className="flex-1 min-h-0">{commentsContent}</div>
            </div>
          </div>
        ) : (
          // DESKTOP LAYOUT
          <SplitPanel
            mode="review"
            leftPanel={mediaContent}
            rightPanel={commentsContent}
            showRightPanel={commentsVisible}
            onRightPanelToggle={setCommentsVisible}
            allowCloseRight={true}
            allowCloseLeft={false}
            rightPanelTitle="Comments"
            leftPanelTitle="Media"
            defaultRightPanelWidth={400}
            minRightPanelWidth={300}
            maxRightPanelWidth={600}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};