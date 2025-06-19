"use client";

import React, { useState, useEffect } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  MessageSquare,
  User,
  Clock,
  Send,
  MoreVertical,
  Reply,
  Heart,
  Edit,
  Trash,
  Loader2,
} from "lucide-react";
import {
  createCommentAction,
  getCommentsAction,
  deleteCommentAction,
} from "./comment-actions";

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
}

interface ReviewCommentsProps {
  mediaId: string;
  mediaType: "video" | "image";
  currentTime?: number;
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
}

export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  mediaId,
  mediaType,
  currentTime = 0,
  onSeekToTimestamp,
  className = "",
}) => {
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(true);

  // Load comments for this media
  useEffect(() => {
    loadComments();
  }, [mediaId]);

  // Load user info from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem("reviewUserName");
    const savedEmail = localStorage.getItem("reviewUserEmail");
    if (savedName) {
      setUserName(savedName);
      setShowUserForm(false);
    }
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, []);

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

    // Check if we need user info
    if (!userName.trim()) {
      setShowUserForm(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Save user info to localStorage
      localStorage.setItem("reviewUserName", userName);
      if (userEmail) {
        localStorage.setItem("reviewUserEmail", userEmail);
      }

      const result = await createCommentAction({
        mediaId,
        userName: userName.trim(),
        userEmail: userEmail.trim() || undefined,
        content: newComment.trim(),
        timestampSeconds:
          mediaType === "video" ? Math.floor(currentTime) : undefined,
        ipAddress: undefined, // You can get this server-side if needed
        userAgent: navigator.userAgent,
      });

      if (result.success && result.comment) {
        setComments([...comments, result.comment]);
        setNewComment("");
        setShowUserForm(false);
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
      const result = await deleteCommentAction(commentId);
      if (result.success) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        console.error("Failed to delete comment:", result.error);
        alert("Failed to delete comment: " + result.error);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Comments Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </h3>
          <RevButtons variant="ghost" size="sm" className="text-gray-400">
            <MoreVertical className="h-4 w-4" />
          </RevButtons>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 px-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1 opacity-75">Start the conversation</p>
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
                formatTime={formatTime}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="space-y-3">
          {/* User Info Form */}
          {showUserForm && (
            <div className="space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-2">
                Enter your details to comment:
              </div>
              <input
                type="text"
                placeholder="Your name *"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-0"
                required
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-0"
              />
            </div>
          )}

          {/* Comment Text Area */}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border-0"
            rows={3}
            disabled={isSubmitting}
          />

          {/* Comment Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {mediaType === "video" && (
                <span className="text-xs text-gray-500">
                  At {formatTime(currentTime)}
                </span>
              )}

              {!showUserForm && userName && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Change name ({userName})
                </button>
              )}
            </div>

            <RevButtons
              onClick={addComment}
              disabled={!newComment.trim() || isSubmitting || !userName.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </>
              )}
            </RevButtons>
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
  formatTime: (time: number) => string;
  formatDate: (date: string) => string;
}> = ({
  comment,
  mediaType,
  onSeekToTimestamp,
  onDelete,
  formatTime,
  formatDate,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [liked, setLiked] = useState(false);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if current user can delete (simple check by name)
  const canDelete = () => {
    const savedName = localStorage.getItem("reviewUserName");
    return savedName === comment.user_name;
  };

  return (
    <div
      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Comment Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {getInitials(comment.user_name)}
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
          {/* Timestamp for video comments */}
          {mediaType === "video" &&
            comment.timestamp_seconds !== undefined &&
            comment.timestamp_seconds !== null &&
            onSeekToTimestamp && (
              <button
                onClick={() => onSeekToTimestamp(comment.timestamp_seconds!)}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:bg-blue-400/10 px-2 py-1 rounded"
              >
                <Clock className="h-3 w-3" />
                {formatTime(comment.timestamp_seconds)}
              </button>
            )}

          {/* Actions Menu */}
          {showActions && (
            <div className="flex items-center gap-1">
              <RevButtons
                variant="ghost"
                size="sm"
                onClick={() => setLiked(!liked)}
                className="text-gray-400 hover:text-red-400 p-1"
              >
                <Heart
                  className={`h-3 w-3 ${liked ? "fill-red-400 text-red-400" : ""}`}
                />
              </RevButtons>
              <RevButtons
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300 p-1"
              >
                <Reply className="h-3 w-3" />
              </RevButtons>
              {canDelete() && (
                <RevButtons
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  <Trash className="h-3 w-3" />
                </RevButtons>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <p className="text-sm text-gray-300 leading-relaxed mb-2">
        {comment.content}
      </p>

      {/* Comment Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
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
