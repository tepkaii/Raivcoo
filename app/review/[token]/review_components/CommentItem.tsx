"use client";

import React, { useState } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import { Clock, Trash, MapPin, Pencil } from "lucide-react";

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

interface CommentItemProps {
  comment: MediaComment;
  mediaType: "video" | "image";
  onSeekToTimestamp?: (timestamp: number) => void;
  onDelete: (id: string) => void;
  onPinClick?: (comment: MediaComment) => void;
  onDrawingClick?: (comment: MediaComment) => void;
  formatTime: (time: number) => string;
  formatDate: (date: string) => string;
  canDelete: boolean;
  isActivePinComment?: boolean;
  isActiveDrawingComment?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  mediaType,
  onSeekToTimestamp,
  onDelete,
  onPinClick,
  onDrawingClick,
  formatTime,
  formatDate,
  canDelete,
  isActivePinComment,
  isActiveDrawingComment,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePinClick = () => {
    if (comment.annotation_data && onPinClick) {
      if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
        onSeekToTimestamp(comment.timestamp_seconds);
      }
      onPinClick(comment);
    }
  };

  const handleDrawingClick = () => {
    if (comment.drawing_data && onDrawingClick) {
      if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
        onSeekToTimestamp(comment.timestamp_seconds);
      }
      onDrawingClick(comment);
    }
  };

  const handleTimestampClick = () => {
    if (comment.timestamp_seconds !== undefined && onSeekToTimestamp) {
      onSeekToTimestamp(comment.timestamp_seconds);
    }
  };

  const hasPin = !!comment.annotation_data;
  const hasDrawing = !!comment.drawing_data;

  return (
    <div
      className={`border bg-primary-foreground rounded-lg p-3 transition-colors`}
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
              className={`text-xs font-mono flex items-center gap-1 px-2 py-1 rounded ${
                isActivePinComment
                  ? "bg-purple-600 text-white" // Active state
                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
              }`}
              title={
                isActivePinComment ? "Hide pin on media" : "View pin on media"
              }
            >
              <MapPin className="h-3 w-3" />
              Pin
            </button>
          )}

          {/* Drawing Button */}
          {hasDrawing && (
            <button
              onClick={handleDrawingClick}
              className={`text-xs font-mono flex items-center gap-1 px-2 py-1 rounded ${
                isActiveDrawingComment
                  ? "bg-green-600 text-white" // Active state
                  : "text-green-400 hover:text-green-300 hover:bg-green-400/10"
              }`}
              title={
                isActiveDrawingComment
                  ? "Hide drawing on media"
                  : "View drawing on media"
              }
            >
              <Pencil className="h-3 w-3" />
              Draw
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
