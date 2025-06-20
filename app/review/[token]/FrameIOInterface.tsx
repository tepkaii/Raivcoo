"use client";

import React, { useState, useRef, useEffect } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import { ReviewComments } from "./ReviewComments";
import { VersionSelector } from "./VersionSelector";
import { MediaDisplay } from "./MediaDisplay";
import { PlayerControls } from "./PlayerControls";
import {
  Download,
  MessageSquare,
  Eye,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { getCommentsAction } from "./comment-actions";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
}

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
  };
}

interface FrameIOInterfaceProps {
  media: MediaFile;
  allVersions?: MediaFile[];
}

export const FrameIOInterface: React.FC<FrameIOInterfaceProps> = ({
  media,
  allVersions = [],
}) => {
  // States
  const [currentMedia, setCurrentMedia] = useState<MediaFile>(media);
  const [selectedTab, setSelectedTab] = useState<"comments" | "details">(
    "comments"
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);
  const [activeCommentPin, setActiveCommentPin] = useState<string | null>(null);

  // Desktop sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load comments when media changes
  useEffect(() => {
    loadComments();
  }, [currentMedia.id]);

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
  const [activeCommentDrawing, setActiveCommentDrawing] = useState<
    string | null
  >(null);

  // Add this handler
  const handleCommentDrawingClick = (comment: MediaComment) => {
    if (comment.drawing_data && comment.timestamp_seconds !== undefined) {
      handleSeekToTimestamp(comment.timestamp_seconds);
      setActiveCommentDrawing(comment.id);
      // NO automatic timeout - let user control when to hide
    }
  };

  // Add useEffect to clear drawing when time changes (similar to pin logic)
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
  // Handle annotation from MediaDisplay
  const handleAddAnnotation = (annotationData: any) => {
    setPendingAnnotation(annotationData);
  };

  // Handle annotation saved from ReviewComments
  const handleAnnotationSaved = () => {
    setPendingAnnotation(null);
    loadComments(); // Reload comments to show the new one
  };

  // Handle comment pin click - show pin and jump to timestamp
  // Handle comment pin click - show pin and jump to timestamp
  const handleCommentPinClick = (comment: MediaComment) => {
    if (comment.annotation_data && comment.timestamp_seconds !== undefined) {
      handleSeekToTimestamp(comment.timestamp_seconds);
      setActiveCommentPin(comment.id);

      // REMOVE the automatic timeout - let user control when to hide
      // setTimeout(() => {
      //   setActiveCommentPin(null);
      // }, 5000);
    }
  };

  // Clear active pin ONLY when time changes significantly AND video is playing
  useEffect(() => {
    if (activeCommentPin && videoRef.current) {
      const activeComment = comments.find((c) => c.id === activeCommentPin);
      if (activeComment && activeComment.timestamp_seconds !== undefined) {
        const timeDiff = Math.abs(
          currentTime - activeComment.timestamp_seconds
        );

        // Only hide pin if video is playing AND time has moved significantly
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

  // Check for mobile layout
  useEffect(() => {
    const checkMobileLayout = () => {
      setIsMobileLayout(window.innerWidth < 1024);
    };

    checkMobileLayout();
    window.addEventListener("resize", checkMobileLayout);
    return () => window.removeEventListener("resize", checkMobileLayout);
  }, []);

  // Version handler
  const handleVersionChange = (version: MediaFile) => {
    setCurrentMedia(version);
  };

  // Handle seeking from comments
  // Remove the complex useEffect time syncing
  // Just pass currentTime directly and let PlayerControls update it

  const handleSeekToTimestamp = (timestamp: number) => {
    if (videoRef.current && currentMedia.file_type === "video") {
      videoRef.current.currentTime = timestamp;
      // Don't set state here, let the video's timeupdate event handle it
    }
  };

  // Desktop sidebar resizing handlers (same as before)
  const handleSidebarMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (isMobileLayout) return;
      setIsSidebarResizing(true);
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isMobileLayout]
  );

  const handleSidebarMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isSidebarResizing || !containerRef.current || isMobileLayout) return;

      e.preventDefault();
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const minWidth = 300;
      const maxWidth = containerRect.width * 0.6;

      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    },
    [isSidebarResizing, isMobileLayout]
  );

  const handleSidebarMouseUp = React.useCallback(() => {
    setIsSidebarResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Event listeners for resizing
  useEffect(() => {
    if (isSidebarResizing && !isMobileLayout) {
      document.addEventListener("mousemove", handleSidebarMouseMove);
      document.addEventListener("mouseup", handleSidebarMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleSidebarMouseMove);
        document.removeEventListener("mouseup", handleSidebarMouseUp);
      };
    }
  }, [
    isSidebarResizing,
    handleSidebarMouseMove,
    handleSidebarMouseUp,
    isMobileLayout,
  ]);

  // Mobile Layout (same structure, just pass new props)
  if (isMobileLayout) {
    return (
      <div className="h-screen flex flex-col bg-black">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <RevButtons
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </RevButtons>

            <h1 className="text-base font-medium text-white truncate">
              {currentMedia.original_filename}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <RevButtons variant="ghost" size="sm" className="text-gray-400">
              <Download className="h-4 w-4" />
            </RevButtons>
            <RevButtons variant="ghost" size="sm" className="text-gray-400">
              <MoreVertical className="h-4 w-4" />
            </RevButtons>
          </div>
        </div>

        {/* Version Selector */}
        {allVersions.length > 0 && (
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex-shrink-0">
            <VersionSelector
              currentMedia={currentMedia}
              allVersions={allVersions}
              onVersionChange={handleVersionChange}
            />
          </div>
        )}

        {/* Media Display */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <MediaDisplay
              media={currentMedia}
              videoRef={videoRef}
              className="h-full"
              onAddAnnotation={handleAddAnnotation}
              activeCommentPin={activeCommentPin}
              comments={comments}
            />
          </div>

          {/* Player Controls */}
          <PlayerControls
            videoRef={videoRef}
            mediaType={currentMedia.file_type}
            comments={comments}
            onSeekToTimestamp={handleSeekToTimestamp}
          />
        </div>

        {/* Comments Panel */}
        <div className="flex-1 bg-gray-900 flex flex-col min-h-0">
          {/* Mobile Tabs */}
          <div className="border-b border-gray-800 px-4 py-3 flex-shrink-0">
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

          {/* Mobile Content */}
          <div className="flex-1 min-h-0">
            {selectedTab === "comments" ? (
              <ReviewComments
                mediaId={currentMedia.id}
                mediaType={currentMedia.file_type}
                currentTime={currentTime}
                onSeekToTimestamp={handleSeekToTimestamp}
                className="h-full"
                pendingAnnotation={pendingAnnotation}
                onAnnotationSaved={handleAnnotationSaved}
                onCommentPinClick={handleCommentPinClick}
              />
            ) : (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Media Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-300 truncate ml-2">
                        {currentMedia.original_filename}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-300">
                        {currentMedia.file_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="text-gray-300">
                        {formatFileSize(currentMedia.file_size)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version:</span>
                      <span className="text-gray-300">
                        v{currentMedia.version_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uploaded:</span>
                      <span className="text-gray-300">
                        {formatDate(currentMedia.uploaded_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (same structure, just pass new props)
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <RevButtons
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </RevButtons>

          <h1 className="text-lg font-medium text-white">
            {currentMedia.original_filename}
          </h1>

          {allVersions.length > 0 && (
            <VersionSelector
              currentMedia={currentMedia}
              allVersions={allVersions}
              onVersionChange={handleVersionChange}
            />
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>{formatFileSize(currentMedia.file_size)}</span>
          <span>•</span>
          <span>{formatDate(currentMedia.uploaded_at)}</span>

          <RevButtons variant="ghost" size="sm" className="text-gray-400">
            <Download className="h-4 w-4" />
          </RevButtons>

          <RevButtons variant="ghost" size="sm" className="text-gray-400">
            <MoreVertical className="h-4 w-4" />
          </RevButtons>
        </div>
      </div>

      {/* Main Layout */}
      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* Left Panel - Media Display + Player Controls */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ width: `calc(100% - ${sidebarWidth}px)` }}
        >
          {/* Media Display */}
          <div className="flex-1 min-h-0">
            <MediaDisplay
              media={currentMedia}
              videoRef={videoRef}
              className="h-full"
              onAddAnnotation={handleAddAnnotation}
              activeCommentPin={activeCommentPin}
              activeCommentDrawing={activeCommentDrawing} // Add this
              comments={comments}
            />
          </div>

          {/* Player Controls */}
          <PlayerControls
            videoRef={videoRef}
            mediaType={currentMedia.file_type}
            comments={comments}
            onSeekToTimestamp={handleSeekToTimestamp}
            onTimeUpdate={setCurrentTime} // Add this line
          />
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className="w-1 bg-gray-800 hover:bg-gray-600 cursor-col-resize group relative select-none flex-shrink-0"
          onMouseDown={handleSidebarMouseDown}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 w-5" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Right Sidebar - Comments */}
        <div
          className="bg-gray-900 flex flex-col flex-shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Sidebar Tabs */}
          <div className="border-b border-gray-800 px-4 py-3 flex-shrink-0">
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

          {/* Sidebar Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedTab === "comments" ? (
              <ReviewComments
                mediaId={currentMedia.id}
                mediaType={currentMedia.file_type}
                currentTime={currentTime}
                onSeekToTimestamp={handleSeekToTimestamp}
                className="h-full"
                pendingAnnotation={pendingAnnotation}
                onAnnotationSaved={handleAnnotationSaved}
                onCommentPinClick={handleCommentPinClick}
                onCommentDrawingClick={handleCommentDrawingClick} // Add this
              />
            ) : (
              <div className="p-4 space-y-6 overflow-y-auto">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Media Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-300">
                        {currentMedia.original_filename}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-300">
                        {currentMedia.file_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="text-gray-300">
                        {formatFileSize(currentMedia.file_size)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version:</span>
                      <span className="text-gray-300">
                        v{currentMedia.version_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uploaded:</span>
                      <span className="text-gray-300">
                        {formatDate(currentMedia.uploaded_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};