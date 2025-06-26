// app/review/[token]/review_components/ReviewComments.tsx

"use client";

import React, { useState, useEffect } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  MessageSquare,
  Clock,
  Send,
  Trash,
  Loader2,
  MapPin,
  Pencil,
} from "lucide-react";
import {
  createCommentAction,
  getCommentsAction,
  deleteCommentAction,
} from "../lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_id?: string;
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
  session_id?: string;
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

interface ReviewCommentsProps {
  mediaId: string;
  mediaType: "video" | "image";
  currentTime?: number;
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
  pendingAnnotation?: any;
  onAnnotationSaved?: () => void;
  onCommentPinClick?: (comment: MediaComment) => void;
  onCommentDrawingClick?: (comment: MediaComment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentAdded?: (comment: MediaComment) => void;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  mediaId,
  mediaType,
  currentTime = 0,
  onSeekToTimestamp,
  className = "",
  pendingAnnotation,
  onAnnotationSaved,
  onCommentPinClick,
  onCommentDrawingClick,
  onCommentDeleted,
  onCommentAdded,
  authenticatedUser,
}) => {
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(true);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);

  const getSessionId = () => {
    if (typeof window === "undefined") return null;

    let sessionId = localStorage.getItem("reviewSessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("reviewSessionId", sessionId);
    }
    return sessionId;
  };

  // Load comments for this media
  useEffect(() => {
    loadComments();
  }, [mediaId]);

  // Initialize user data based on authentication status
  useEffect(() => {
    if (authenticatedUser) {
      // User is logged in, use their data
      setUserName(authenticatedUser.name || authenticatedUser.email);
      setUserEmail(authenticatedUser.email);
      setShowUserForm(false);
    } else {
      // User is not logged in, check localStorage
      const savedName = localStorage.getItem("reviewUserName");
      const savedEmail = localStorage.getItem("reviewUserEmail");
      if (savedName) {
        setUserName(savedName);
        setShowUserForm(false);
      }
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }
  }, [authenticatedUser]);

  // Handle pending annotation (pin or drawing)
  useEffect(() => {
    if (pendingAnnotation) {
      setIsAddingAnnotation(true);
      if (pendingAnnotation.type === "pin") {
        setNewComment("");
      } else if (pendingAnnotation.type === "drawing") {
        setNewComment("");
      }
    }
  }, [pendingAnnotation]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const result = await getCommentsAction(mediaId);
      if (result.success) {
        setComments(result.comments || []);
      } else {
        console.error("Failed to load comments:", result.error);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    // For authenticated users, skip user info validation
    if (!authenticatedUser && !userName.trim()) {
      setShowUserForm(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Only save to localStorage if user is not authenticated
      if (!authenticatedUser) {
        localStorage.setItem("reviewUserName", userName);
        if (userEmail) {
          localStorage.setItem("reviewUserEmail", userEmail);
        }
      }

      // Get session ID
      const sessionId = getSessionId();

      // Prepare annotation or drawing data
      let annotationData = null;
      let drawingData = null;

      if (pendingAnnotation) {
        if (pendingAnnotation.type === "pin") {
          annotationData = {
            id: pendingAnnotation.data.id,
            x: pendingAnnotation.data.x,
            y: pendingAnnotation.data.y,
            mediaWidth: pendingAnnotation.data.mediaWidth,
            mediaHeight: pendingAnnotation.data.mediaHeight,
            createdAtScale: pendingAnnotation.data.createdAtScale,
            timestamp: pendingAnnotation.data.timestamp,
            color: pendingAnnotation.data.color || "#ff0000",
          };
        } else if (pendingAnnotation.type === "drawing") {
          drawingData = {
            id: pendingAnnotation.data.id,
            strokes: pendingAnnotation.data.strokes,
            timestamp: pendingAnnotation.data.timestamp,
            mediaWidth: pendingAnnotation.data.mediaWidth,
            mediaHeight: pendingAnnotation.data.mediaHeight,
            createdAtScale: pendingAnnotation.data.createdAtScale,
          };
        }
      }

      const result = await createCommentAction({
        mediaId,
        userName: authenticatedUser
          ? authenticatedUser.name || authenticatedUser.email
          : userName.trim(),
        userEmail: authenticatedUser
          ? authenticatedUser.email
          : userEmail.trim() || undefined,
        userId: authenticatedUser?.id,
        content: newComment.trim(),
        timestampSeconds: mediaType === "video" ? currentTime : undefined,
        ipAddress: undefined,
        userAgent: navigator.userAgent,
        annotationData,
        drawingData,
        sessionId,
      });

      if (result.success && result.comment) {
        setComments([...comments, result.comment]);
        onCommentAdded?.(result.comment);
        setNewComment("");
        setShowUserForm(false);
        setIsAddingAnnotation(false);

        // Call annotation saved callback
        if (pendingAnnotation && onAnnotationSaved) {
          onAnnotationSaved();
        }
      } else {
        console.error("Failed to add comment:", result.error);
        alert("Failed to add comment: " + result.error);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const sessionId = getSessionId();

      const result = await deleteCommentAction(commentId, sessionId);
      if (result.success) {
        setComments(comments.filter((c) => c.id !== commentId));
        onCommentDeleted?.(commentId);
      } else {
        console.error("Failed to delete comment:", result.error);
        alert("Failed to delete comment: " + result.error);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  // Check if current user can delete a comment
  const canDeleteComment = (comment: MediaComment) => {
    if (authenticatedUser) {
      // Authenticated user can delete their own comments
      return comment.user_id === authenticatedUser.id;
    } else {
      // Anonymous user can delete comments from their session
      const sessionId = localStorage.getItem("reviewSessionId");
      return sessionId && comment.session_id === sessionId;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cancelAnnotation = () => {
    setIsAddingAnnotation(false);
    setNewComment("");
    if (onAnnotationSaved) {
      onAnnotationSaved(); // This will clear the pending annotation
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center gap-2 ">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-12  px-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Start the conversation
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                mediaType={mediaType}
                onSeekToTimestamp={onSeekToTimestamp}
                onDelete={deleteComment}
                onPinClick={onCommentPinClick}
                onDrawingClick={onCommentDrawingClick}
                formatTime={formatTime}
                formatDate={formatDate}
                canDelete={canDeleteComment(comment)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border p-4">
        <div className="space-y-3">
          {/* Annotation Alert */}
          {isAddingAnnotation && (
            <div
              className={`p-3 border rounded-lg ${
                pendingAnnotation?.type === "pin"
                  ? "bg-purple-600/20 border-purple-600/50"
                  : "bg-green-600/20 border-green-600/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-2 ${
                    pendingAnnotation?.type === "pin"
                      ? "text-purple-300"
                      : "text-green-300"
                  }`}
                >
                  {pendingAnnotation?.type === "pin" ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    Adding{" "}
                    {pendingAnnotation?.type === "pin" ? "pin" : "drawing"}{" "}
                    comment
                  </span>
                </div>
                <button
                  onClick={cancelAnnotation}
                  className={`hover:text-white text-sm ${
                    pendingAnnotation?.type === "pin"
                      ? "text-purple-300"
                      : "text-green-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* User Info Form - only show for non-authenticated users */}
          {!authenticatedUser && showUserForm && (
            <div className="space-y-2 p-3 bg-primary-foreground rounded-lg border ">
              <div className="text-xs  mb-2">
                Enter your details to comment:
              </div>
              <Input
                type="text"
                placeholder="Your name *"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="bg-background"
              />
              <Input
                type="email"
                placeholder="Your email (optional)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="bg-background"
              />
            </div>
          )}

          {/* Show authenticated user info */}
          {authenticatedUser && (
            <div className="text-xs text-muted-foreground">
              Commenting as: {authenticatedUser.name || authenticatedUser.email}
            </div>
          )}

          {/* Comment Text Area */}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              isAddingAnnotation
                ? `Describe this ${pendingAnnotation?.type === "pin" ? "pin" : "drawing"}...`
                : "Add a comment..."
            }
            className="bg-primary-foreground"
            rows={1}
            disabled={isSubmitting}
          />

          {/* Comment Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {mediaType === "video" && !isAddingAnnotation && (
                <span className="text-xs text-muted-foreground">
                  At {formatTime(currentTime)}
                </span>
              )}

              {/* Only show change name option for non-authenticated users */}
              {!authenticatedUser && !showUserForm && userName && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Change name ({userName})
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {isAddingAnnotation && (
                <RevButtons
                  onClick={cancelAnnotation}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-white"
                >
                  Cancel
                </RevButtons>
              )}

              <RevButtons
                onClick={addComment}
                disabled={
                  !newComment.trim() ||
                  isSubmitting ||
                  (!authenticatedUser && !userName.trim())
                }
                size="sm"
                className={`${
                  isAddingAnnotation
                    ? pendingAnnotation?.type === "pin"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    {isAddingAnnotation ? (
                      pendingAnnotation?.type === "pin" ? (
                        <MapPin className="h-4 w-4 mr-1" />
                      ) : (
                        <Pencil className="h-4 w-4 mr-1" />
                      )
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    {isAddingAnnotation
                      ? `Add ${pendingAnnotation?.type === "pin" ? "Pin" : "Drawing"}`
                      : "Post"}
                  </>
                )}
              </RevButtons>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Comment Component
const CommentItem: React.FC<{
  comment: MediaComment;
  mediaType: "video" | "image";
  onSeekToTimestamp?: (timestamp: number) => void;
  onDelete: (id: string) => void;
  onPinClick?: (comment: MediaComment) => void;
  onDrawingClick?: (comment: MediaComment) => void;
  formatTime: (time: number) => string;
  formatDate: (date: string) => string;
  canDelete: boolean;
}> = ({
  comment,
  mediaType,
  onSeekToTimestamp,
  onDelete,
  onPinClick,
  onDrawingClick,
  formatTime,
  formatDate,
  canDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle pin click
  const handlePinClick = () => {
    if (comment.annotation_data && onPinClick) {
      if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
        onSeekToTimestamp(comment.timestamp_seconds);
      }
      onPinClick(comment);
    }
  };

  // Handle drawing click
  const handleDrawingClick = () => {
    if (comment.drawing_data && onDrawingClick) {
      if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
        onSeekToTimestamp(comment.timestamp_seconds);
      }
      onDrawingClick(comment);
    }
  };

  // Handle timestamp click
  const handleTimestampClick = () => {
    if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
      onSeekToTimestamp(comment.timestamp_seconds);
    }
  };

  const hasPin = !!comment.annotation_data;
  const hasDrawing = !!comment.drawing_data;

  return (
    <div
      className={`border bg-primary-foreground rounded-lg p-3  transition-colors `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Comment Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium ${
              hasPin
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : hasDrawing
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
            }`}
          >
            {hasPin ? (
              <MapPin className="h-3 w-3" />
            ) : hasDrawing ? (
              <Pencil className="h-3 w-3" />
            ) : (
              getInitials(comment.user_name)
            )}
          </div>
          <span className="text-sm font-medium text-white">
            {comment.user_name}
          </span>
          {comment.is_pinned && (
            <div
              className="w-3 h-3 bg-yellow-500 rounded-full"
              title="Pinned comment"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pin Button */}
          {hasPin && (
            <button
              onClick={handlePinClick}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 hover:bg-purple-400/10 px-2 py-1 rounded"
              title="View pin on media"
            >
              <MapPin className="h-3 w-3" />
              View Pin
            </button>
          )}

          {/* Drawing Button */}
          {hasDrawing && (
            <button
              onClick={handleDrawingClick}
              className="text-xs text-green-400 hover:text-green-300 font-mono flex items-center gap-1 hover:bg-green-400/10 px-2 py-1 rounded"
              title="View drawing on media"
            >
              <Pencil className="h-3 w-3" />
              View Drawing
            </button>
          )}

          {/* Timestamp for video comments */}
          {mediaType === "video" &&
            comment.timestamp_seconds !== undefined &&
            comment.timestamp_seconds !== null && (
              <button
                onClick={handleTimestampClick}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:bg-blue-400/10 px-2 py-1 rounded"
              >
                <Clock className="h-3 w-3" />
                {formatTime(comment.timestamp_seconds)}
              </button>
            )}

          {/* Actions Menu */}
          {showActions && (
            <div className="flex items-center gap-1">
              {canDelete && (
                <RevButtons
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-muted-foreground hover:text-red-400 p-1"
                >
                  <Trash className="h-3 w-3" />
                </RevButtons>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <p className="text-sm leading-relaxed mb-2">{comment.content}</p>
      {/* Comment Meta */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(comment.created_at)}</span>
        <div className="flex items-center gap-2">
          {comment.user_email && (
            <span className="opacity-75">{comment.user_email}</span>
          )}
        </div>
      </div>
    </div>
  );
};
