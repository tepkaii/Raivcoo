// app/review/[token]/MediaInterface.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ReviewComments } from "./components/ReviewComments";
import { VersionSelector } from "./components/VersionSelector";
import { MediaDisplay } from "./components/MediaDisplay";
import { PlayerControls } from "./components/PlayerControls";
import { SplitPanel } from "@/app/components/SplitPanel";
import { getCommentsAction, updateMediaStatusAction } from "./lib/actions";
import { MediaFile } from "@/app/dashboard/lib/types";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
// ✅ ADD FILE CATEGORY HELPER
const getFileCategory = (fileType: string, mimeType: string) => {
  if (fileType === "video") return "video";
  if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType === "text/plain"
  )
    return "document";
  return "unknown";
};

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
  avatar_url?: string;
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
  allowDownload?: boolean;
  userProjectRelationship?: {
    role: string;
    isOwner: boolean;
    isMember?: boolean;
    isOutsider?: boolean;
  } | null;
  projectId?: string;
  reviewToken?: string;
}

export const MediaInterface: React.FC<MediaInterface> = ({
  media,
  allVersions = [],
  authenticatedUser,
  reviewTitle,
  projectName,
  allowDownload = false,
  userProjectRelationship,
  projectId,
  reviewToken,
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
  const audioRef = useRef<HTMLAudioElement>(null); // ✅ ADD AUDIO REF
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // ✅ GET FILE CATEGORY
  const fileCategory = getFileCategory(
    currentMedia.file_type,
    currentMedia.mime_type
  );

  // ✅ DOWNLOAD HANDLER
  const handleDownload = useCallback(
    async (mediaFile: MediaFile) => {
      if (!allowDownload) {
        toast({
          title: "Download Disabled",
          description: "Downloads are not allowed for this review link",
          variant: "warning",
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
      // Clear any active comment pins/drawings when starting new annotation OR canceling
      if (type !== "none") {
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      }

      if (type === "none") {
        // Cancel annotation mode
        setAnnotationMode("none");
        setAnnotationConfig({});
        // Also clear active comments when canceling
        setActiveCommentPin(null);
        setActiveCommentDrawing(null);
      } else {
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
    if (activeCommentDrawing && (videoRef.current || audioRef.current)) {
      const activeComment = comments.find((c) => c.id === activeCommentDrawing);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        const mediaElement = videoRef.current || audioRef.current;
        if (timeDiff > 2 && mediaElement && !mediaElement.paused) {
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
    if (activeCommentPin && (videoRef.current || audioRef.current)) {
      const activeComment = comments.find((c) => c.id === activeCommentPin);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );
        const mediaElement = videoRef.current || audioRef.current;
        if (timeDiff > 2 && mediaElement && !mediaElement.paused) {
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
      if (fileCategory === "video" && videoRef.current) {
        videoRef.current.currentTime = timestamp;
      } else if (fileCategory === "audio" && audioRef.current) {
        audioRef.current.currentTime = timestamp;
      }
    },
    [fileCategory]
  );

  const handleCommentDeleted = useCallback((deletedCommentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedCommentId));
  }, []);

  // ✅ DETERMINE IF PLAYER CONTROLS SHOULD SHOW
  const showPlayerControls =
    fileCategory === "video" || fileCategory === "audio";

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
          audioRef={audioRef} // ✅ ADD AUDIO REF
          className="h-full"
          onAnnotationComplete={handleAnnotationComplete}
          activeCommentPin={activeCommentPin}
          activeCommentDrawing={activeCommentDrawing}
          comments={comments}
          currentTime={currentTime}
          annotationMode={annotationMode}
          annotationConfig={annotationConfig}
          allowDownload={allowDownload}
        />
      </div>

      {/* ✅ ONLY SHOW PLAYER CONTROLS FOR VIDEO AND AUDIO */}
      {showPlayerControls && (
        <PlayerControls
          videoRef={videoRef}
          audioRef={audioRef} // ✅ ADD AUDIO REF
          mediaType={currentMedia.file_type}
          media={currentMedia} // ✅ ADD THIS LINE
          comments={comments}
          onSeekToTimestamp={handleSeekToTimestamp}
          onTimeUpdate={setCurrentTime}
          fullscreenContainerRef={fullscreenContainerRef}
          className={
            isFullscreen ? "absolute bottom-0 left-0 right-0 z-50" : ""
          }
          authenticatedUser={authenticatedUser}
        />
      )}
    </div>
  );

  const commentsContent = (
    <ReviewComments
      mediaId={currentMedia.id}
      mediaType={currentMedia.file_type}
      media={currentMedia} // ✅ ADD THIS LINE
      currentTime={currentTime}
      onSeekToTimestamp={handleSeekToTimestamp}
      className="h-full "
      onCommentPinClick={handleCommentPinClick}
      onCommentDrawingClick={handleCommentDrawingClick}
      onCommentDeleted={handleCommentDeleted}
      onCommentAdded={handleCommentAdded}
      onAnnotationRequest={handleAnnotationRequest}
      onClearActiveComments={clearActiveComments}
      authenticatedUser={authenticatedUser}
      activeCommentPin={activeCommentPin}
      activeCommentDrawing={activeCommentDrawing}
      projectMode={false}
      projectId={projectId}
      reviewToken={reviewToken}
      userProjectRelationship={userProjectRelationship}
      createCommentOverride={undefined}
      userPermissions={{
        canComment: true,
        canEditStatus: true,
      }}
    />
  );

  // SINGLE LAYOUT that adapts with CSS and conditional rendering
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - adapts for mobile/desktop */}
      {/* ✅ STREAMLINED HEADER WITH DROPDOWN */}
      <header className="bg-background border-b px-3 md:px-4 h-[50px] flex justify-between items-center md:sticky md:top-0 z-50">
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

            {/* ✅ DOWNLOAD BUTTON - Desktop Only */}
            {!isMobile && (
              <div className="border-l ml-2 flex items-center">
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
            )}
          </div>
        </div>

        {/* ✅ MOBILE ACTIONS DROPDOWN */}
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleDownload(currentMedia)}
                disabled={!allowDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                {allowDownload ? "Download" : "Download Disabled"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Select
                  value={currentMedia.status || "in_progress"}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-full text-xs rounded-full">
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* ✅ DESKTOP STATUS SELECTOR */
          <div className="flex justify-end items-center gap-2">
            <p className="text-xs text-muted-foreground">Status:</p>
            <Select
              value={currentMedia.status || "in_progress"}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="text-xs rounded-full">
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
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          // MOBILE LAYOUT
          <div className="flex flex-col h-full">
            {/* Mobile Media Area */}
            <div className="h-[40svh] flex-shrink-0 bg-black">
              <MediaDisplay
                media={currentMedia}
                videoRef={videoRef}
                audioRef={audioRef} // ✅ ADD AUDIO REF
                className="h-full w-full"
                onAnnotationComplete={handleAnnotationComplete}
                activeCommentPin={activeCommentPin}
                activeCommentDrawing={activeCommentDrawing}
                comments={comments}
                currentTime={currentTime}
                annotationMode={annotationMode}
                annotationConfig={annotationConfig}
                allowDownload={allowDownload}
              />
            </div>

            {/* ✅ PLAYER CONTROLS - ONLY FOR VIDEO/AUDIO */}
            {showPlayerControls && (
              <div className="flex-shrink-0">
                <PlayerControls
                  videoRef={videoRef}
                  audioRef={audioRef} // ✅ ADD AUDIO REF
                  mediaType={currentMedia.file_type}
                  media={currentMedia}
                  comments={comments}
                  onSeekToTimestamp={handleSeekToTimestamp}
                  onTimeUpdate={setCurrentTime}
                  fullscreenContainerRef={null}
                  className=""
                />
              </div>
            )}
            {/* Mobile Comments Area */}
            <div className="flex-1 min-h-0 flex flex-col ">
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