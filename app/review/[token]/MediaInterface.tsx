"use client";

import React, { useState, useRef, useEffect } from "react";
import { ReviewComments } from "./review_components/ReviewComments";
import { VersionSelector } from "./review_components/VersionSelector";
import { MediaDisplay } from "./review_components/MediaDisplay";
import { PlayerControls } from "./review_components/PlayerControls";
import { SplitPanel } from "@/app/components/SplitPanel";
import { Download, ArrowLeft, Eye, MessageSquare } from "lucide-react";
import { getCommentsAction } from "./lib/actions";
import { MediaFile } from "@/app/dashboard/lib/types";

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
  authenticatedUser?: { id: string; email: string; name: string } | null;
}

export const MediaInterface: React.FC<MediaInterface> = ({
  media,
  allVersions = [],
  authenticatedUser,
}) => {
  // States
  const [currentMedia, setCurrentMedia] = useState<MediaFile>(media);
  const [selectedTab, setSelectedTab] = useState<"comments" | "details">(
    "comments"
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);
  const [activeCommentPin, setActiveCommentPin] = useState<string | null>(null);
  const [activeCommentDrawing, setActiveCommentDrawing] = useState<
    string | null
  >(null);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

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

  const handleCommentDrawingClick = (comment: MediaComment) => {
    if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
      handleSeekToTimestamp(comment.timestamp_seconds);
      setActiveCommentDrawing(comment.id);
    }
  };

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

  const handleAddAnnotation = (annotationData: any) => {
    setPendingAnnotation(annotationData);
  };

  const handleCommentAdded = (newComment: MediaComment) => {
    setComments([...comments, newComment]);
  };

  const handleAnnotationSaved = () => {
    setPendingAnnotation(null);
  };

  const handleCommentPinClick = (comment: MediaComment) => {
    if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
      handleSeekToTimestamp(comment.timestamp_seconds);
      setActiveCommentPin(comment.id);
    }
  };

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleVersionChange = (version: MediaFile) => {
    setCurrentMedia(version);
  };

  const handleSeekToTimestamp = (timestamp: number) => {
    if (videoRef.current && currentMedia.file_type === "video") {
      videoRef.current.currentTime = timestamp;
    }
  };

  const handleCommentDeleted = (deletedCommentId: string) => {
    setComments(comments.filter((c) => c.id !== deletedCommentId));
  };

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
          onAddAnnotation={handleAddAnnotation}
          activeCommentPin={activeCommentPin}
          activeCommentDrawing={activeCommentDrawing}
          comments={comments}
          currentTime={currentTime}
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

  const commentsContent =
    selectedTab === "comments" ? (
      <ReviewComments
        mediaId={currentMedia.id}
        mediaType={currentMedia.file_type}
        currentTime={currentTime}
        onSeekToTimestamp={handleSeekToTimestamp}
        className="h-full"
        pendingAnnotation={pendingAnnotation}
        onAnnotationSaved={handleAnnotationSaved}
        onCommentPinClick={handleCommentPinClick}
        onCommentDrawingClick={handleCommentDrawingClick}
        onCommentDeleted={handleCommentDeleted}
        onCommentAdded={handleCommentAdded}
        authenticatedUser={authenticatedUser}
      />
    ) : (
      <div className="p-4 space-y-4 overflow-y-auto h-full">
        <div>
          <h3 className="text-sm font-medium mb-3">Media Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="truncate ml-2">
                {currentMedia.original_filename}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{currentMedia.file_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{formatFileSize(currentMedia.file_size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span>v{currentMedia.version_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded:</span>
              <span>{formatDate(currentMedia.uploaded_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );

  // SINGLE LAYOUT that adapts with CSS and conditional rendering
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - adapts for mobile/desktop */}
      <header className="bg-background border-b px-3 md:px-4 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-white p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base md:text-lg font-medium text-white truncate">
            {currentMedia.original_filename}
          </h1>
          {/* Version selector - show inline on desktop, separate row on mobile */}
          {allVersions.length > 0 && !isMobile && (
            <VersionSelector
              currentMedia={currentMedia}
              allVersions={allVersions}
              onVersionChange={handleVersionChange}
            />
          )}
        </div>

        {/* Desktop header info */}
        {!isMobile && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatFileSize(currentMedia.file_size)}</span>
            <span>•</span>
            <span>{formatDate(currentMedia.uploaded_at)}</span>
          </div>
        )}
      </header>

      {/* Mobile Version Selector Row */}
      {isMobile && allVersions.length > 0 && (
        <div className="bg-background border-b px-4 py-2 flex-shrink-0">
          <VersionSelector
            currentMedia={currentMedia}
            allVersions={allVersions}
            onVersionChange={handleVersionChange}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          // MOBILE LAYOUT
          <div className="flex flex-col h-full">
            {/* Mobile Media Area */}
            <div className="h-[45vh] flex-shrink-0">{mediaContent}</div>

            {/* Mobile Comments Area */}
            <div className="flex-1 min-h-0 flex flex-col border-t border-border">
              {/* Mobile Tab Navigation */}
              <div className="border-b border-border px-4 py-2 flex-shrink-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedTab("comments")}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTab === "comments"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Comments
                  </button>
                  <button
                    onClick={() => setSelectedTab("details")}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTab === "details"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    Details
                  </button>
                </div>
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
            rightPanel={
              <div className="flex flex-col h-full">
                {/* Desktop Tab Navigation */}
                <div className="border-b border px-4 py-3 flex-shrink-0">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedTab("comments")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        selectedTab === "comments"
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Comments
                    </button>
                    <button
                      onClick={() => setSelectedTab("details")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        selectedTab === "details"
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Details
                    </button>
                  </div>
                </div>
                {/* Desktop Comments Content */}
                <div className="flex-1 min-h-0">{commentsContent}</div>
              </div>
            }
            showRightPanel={commentsVisible}
            onRightPanelToggle={setCommentsVisible}
            allowCloseRight={true}
            allowCloseLeft={false}
            rightPanelTitle={
              selectedTab === "comments" ? "Comments" : "Details"
            }
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
