// app/review/[token]/review_components/CommentItem.tsx
// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Clock, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { linkifyToReact } from "../../lib/links";
import {
  ClipboardDocumentIcon,
  MapPinIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { createClient } from "@/utils/supabase/client";
import { getFileCategory } from "@/app/dashboard/utilities";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  avatar_url?: string;
  content: string;
  timestamp_seconds?: number;
  timestamp_start_seconds?: number; // ✅ NEW: Range start
  timestamp_end_seconds?: number; // ✅ NEW: Range end
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  is_resolved: boolean;
  is_being_edited?: boolean;
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
  replies?: MediaComment[];
}

interface CommentItemProps {
  comment: MediaComment;
  mediaType: "video" | "image" | "audio" | "document" | "svg";
  media?: any;
  currentTime?: number;
  onSeekToTimestamp?: (timestamp: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onPinClick?: (comment: MediaComment) => void;
  onDrawingClick?: (comment: MediaComment) => void;
  onReplyClick?: (comment: MediaComment) => void;
  onCommentUpdated?: (updatedComment: MediaComment) => void;
  formatTime: (time: number) => string;
  formatDate: (date: string) => string;
  canDelete: boolean;
  canEdit?: boolean;
  isActivePinComment?: boolean;
  isActiveDrawingComment?: boolean;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null;
  replyingTo?: string | null;
}

const SingleComment: React.FC<{
  comment: MediaComment;
  isLast: boolean;
  onAction: (action: string, comment: MediaComment, data?: any) => void;
  props: Omit<CommentItemProps, "comment">;
}> = ({ comment, isLast, onAction, props }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isResolutionLoading, setIsResolutionLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Use local state that starts with the comment's current resolution status
  const [isResolved, setIsResolved] = useState(comment.is_resolved);

  const supabase = createClient();
  const isCurrentUser = props.authenticatedUser?.id === comment.user_id;

  // ✅ DETERMINE FILE CATEGORY - SUPPORTS TIMESTAMPS FOR VIDEO/AUDIO
  const fileCategory = props.media
    ? getFileCategory(props.media.file_type, props.media.mime_type)
    : props.mediaType;
  const supportsTimestamps =
    fileCategory === "video" || fileCategory === "audio";

  // ✅ DETERMINE COMMENT TYPE - UPDATED LOGIC
  const isRangeComment =
    comment.timestamp_start_seconds != null &&
    comment.timestamp_end_seconds != null &&
    comment.timestamp_seconds == null; // Ensure it's not a regular timestamp comment

  const isTimestampComment =
    comment.timestamp_seconds != null &&
    comment.timestamp_start_seconds == null &&
    comment.timestamp_end_seconds == null; // Ensure it's not a range comment

  const getSessionId = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("reviewSessionId");
  };

  // ✅ CALCULATE PERMISSIONS HERE FOR THIS SPECIFIC COMMENT
  const canModify = (() => {
    if (props.authenticatedUser) {
      const result = comment.user_id === props.authenticatedUser.id;
      return result;
    } else {
      const sessionId = getSessionId();
      const result = sessionId && comment.session_id === sessionId;
      return result;
    }
  })();

  const getDisplayName = () => {
    // If this is the current authenticated user, use their data directly
    if (isCurrentUser && props.authenticatedUser?.name) {
      return props.authenticatedUser.name;
    }

    // Use the comment's stored user name
    return comment.user_name || "Guest User";
  };

  const displayName = getDisplayName();

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "G";

    if (
      name.toLowerCase() === "guest user" ||
      name.toLowerCase() === "anonymous"
    ) {
      return "G";
    }

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = () => {
    // If this is the current authenticated user, prefer their live avatar
    if (isCurrentUser && props.authenticatedUser?.avatar_url && !avatarError) {
      return props.authenticatedUser.avatar_url;
    }

    // Otherwise, use the stored avatar from when the comment was created
    if (comment.avatar_url && !avatarError) {
      return comment.avatar_url;
    }

    return null;
  };

  const getAvatarColor = () => {
    if (comment.annotation_data) {
      return "bg-gradient-to-br from-purple-500 to-pink-600";
    }
    if (comment.drawing_data) {
      return "bg-gradient-to-br from-teal-500 to-emerald-600";
    }
    // ✅ DIFFERENT COLOR FOR RANGE COMMENTS
    if (isRangeComment) {
      return "bg-gradient-to-br from-green-500 to-emerald-600";
    }
    return "bg-gradient-to-br from-blue-500 to-purple-600";
  };

  const avatarUrl = getAvatarUrl();
  const hasValidAvatar = !!avatarUrl;
  const hasPin = !!comment.annotation_data;
  const hasDrawing = !!comment.drawing_data;
  const isBeingRepliedTo = props.replyingTo === comment.id;

  // ✅ USE LOCAL canModify INSTEAD OF props.canEdit
  const canEdit = canModify && !comment.is_being_edited;
  const canResolve = !comment.parent_comment_id; // Anyone can resolve parent comments

  const linkifiedContent = linkifyToReact(comment.content, {
    target: "_blank",
    className:
      "text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 break-words",
    rel: "noopener noreferrer",
  });

  const handleCopyComment = async () => {
    try {
      await navigator.clipboard.writeText(comment.content);
      toast({
        title: "Success",
        description: "Comment copied to clipboard",
        variant: "green",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy comment",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setShowEditDialog(false);
      return;
    }

    setIsEditLoading(true);
    try {
      await onAction("edit", comment, editContent.trim());
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Comment updated successfully",
        variant: "teal",
      });
    } catch (error) {
      console.error("Failed to edit comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await onAction("delete", comment);
      setShowDeleteDialog(false);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
        variant: "green",
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  // Direct Supabase update - UI updates immediately via local state
  const handleToggleResolution = async () => {
    setIsResolutionLoading(true);
    const newResolvedStatus = !isResolved;

    try {
      // Check if this is a parent comment (only parent comments can be resolved)
      if (comment.parent_comment_id) {
        toast({
          title: "Error",
          description: "Only parent comments can be resolved",
          variant: "destructive",
        });
        setIsResolutionLoading(false);
        return;
      }

      // Update local state immediately for instant UI feedback
      setIsResolved(newResolvedStatus);

      // Update database - anyone can now update resolution status
      const { error } = await supabase
        .from("media_comments")
        .update({
          is_resolved: newResolvedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", comment.id);

      if (error) {
        // Revert local state if database update failed
        setIsResolved(!newResolvedStatus);
        console.error("Failed to update resolution status:", error);
        throw error;
      }

      // Notify parent component if callback exists
      if (props.onCommentUpdated) {
        props.onCommentUpdated({
          ...comment,
          is_resolved: newResolvedStatus,
          updated_at: new Date().toISOString(),
        });
      }

      // Show success message
      toast({
        title: "Success",
        description: newResolvedStatus
          ? "Comment marked as resolved"
          : "Comment marked as unresolved",
        variant: newResolvedStatus ? "green" : "outline",
      });
    } catch (error) {
      console.error("Failed to toggle resolution:", error);

      // Revert local state on error if it hasn't been reverted already
      setIsResolved(!newResolvedStatus);

      toast({
        title: "Error",
        description: "Failed to update comment resolution",
        variant: "destructive",
      });
    } finally {
      setIsResolutionLoading(false);
    }
  };

  // ✅ HANDLE RANGE COMMENT CLICK
  const handleRangeCommentClick = () => {
    if (isRangeComment && comment.timestamp_start_seconds !== undefined) {
      onAction("timestamp", comment, comment.timestamp_start_seconds);
    }
  };

  // ✅ HANDLE REGULAR TIMESTAMP COMMENT CLICK
  const handleTimestampCommentClick = () => {
    if (isTimestampComment && comment.timestamp_seconds !== undefined) {
      onAction("timestamp", comment, comment.timestamp_seconds);
    }
  };

  return (
    <>
      <div className="flex gap-3 relative">
        {/* Avatar with connector */}
        <div className="flex flex-col items-center relative">
          <div
            className={`w-8 h-8 rounded-[5px] select-none border-black/20 border-2 flex items-center justify-center text-sm text-white font-medium z-10 overflow-hidden ${
              hasValidAvatar ? "p-0" : getAvatarColor()
            }`}
          >
            {hasValidAvatar ? (
              <img
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              getInitials(displayName)
            )}
          </div>

          {/* Vertical connector line */}
          {!isLast && (
            <div
              className={`w-0.5 bg-gray-600 absolute top-8 bottom-0 left-1/2 transform -translate-x-1/2 ${
                isResolved ? "opacity-40" : ""
              }`}
            />
          )}
        </div>

        {/* Comment content */}
        <div
          className={`flex-1 ${comment.is_being_edited ? "opacity-60" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{displayName}</span>

              {comment.is_pinned && (
                <div
                  className="w-3 h-3 bg-yellow-500 rounded-full"
                  title="Pinned comment"
                />
              )}

              {comment.is_being_edited && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                  Being edited
                </span>
              )}
            </div>

            <div className="flex items-center">
              {/* Resolution toggle button */}
              {canResolve && (
                <button
                  onClick={handleToggleResolution}
                  disabled={isResolutionLoading}
                  className={`text-xs font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200 ${
                    isResolved
                      ? "text-green-600"
                      : "text-muted-foreground hover:text-green-300"
                  }`}
                  title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
                >
                  {isResolutionLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : isResolved ? (
                    <CheckBadgeIcon className="size-5" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* Pin Button */}
              {hasPin && (
                <button
                  onClick={() => onAction("pin", comment)}
                  className={`text-xs font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200 ${
                    props.isActivePinComment
                      ? "text-purple-600"
                      : "text-muted-foreground hover:text-purple-300"
                  }`}
                  title={
                    props.isActivePinComment
                      ? "Hide pin on media"
                      : "View pin on media"
                  }
                >
                  <MapPinIcon className="size-4" />
                </button>
              )}

              {/* Drawing Button */}
              {hasDrawing && (
                <button
                  onClick={() => onAction("drawing", comment)}
                  className={`text-xs font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200 ${
                    props.isActiveDrawingComment
                      ? "text-teal-600"
                      : "text-muted-foreground hover:text-teal-300"
                  }`}
                  title={
                    props.isActiveDrawingComment
                      ? "Hide drawing on media"
                      : "View drawing on media"
                  }
                >
                  <PencilIcon className="size-4" />
                </button>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAction("reply", comment)}
                  className={`p-1 transition-colors duration-200 ${
                    isBeingRepliedTo
                      ? "text-blue-400 bg-blue-500/20"
                      : "text-muted-foreground hover:text-blue-400"
                  }`}
                  title="Reply to comment"
                >
                  <Reply className="h-3 w-3" />
                </Button>

                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-1 text-muted-foreground hover:text-white"
                      title="More actions"
                    >
                      <EllipsisVerticalIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleCopyComment}>
                      <ClipboardDocumentIcon className="h-3 w-3 mr-2" />
                      Copy
                    </DropdownMenuItem>

                    {canResolve && (
                      <DropdownMenuItem
                        onClick={handleToggleResolution}
                        disabled={isResolutionLoading}
                        className={
                          isResolved
                            ? "text-yellow-400 focus:text-yellow-400"
                            : "text-green-400 focus:text-green-400"
                        }
                      >
                        <CheckIcon className="h-3 w-3 mr-2" />
                        {isResolutionLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : isResolved ? (
                          "Mark Unresolved"
                        ) : (
                          "Mark Resolved"
                        )}
                      </DropdownMenuItem>
                    )}

                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => {
                          setShowEditDialog(true);
                          setDropdownOpen(false);
                        }}
                        disabled={comment.is_being_edited}
                      >
                        <PencilSquareIcon className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}

                    {canModify && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setShowDeleteDialog(true);
                            setDropdownOpen(false);
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <TrashIcon className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Comment Content with Linkified URLs */}
          <div
            className={`text-sm leading-relaxed mb-2 break-all ${
              isResolved ? "line-through text-gray-400" : ""
            }`}
          >
            {linkifiedContent.map((part, index) => (
              <React.Fragment key={index}>{part}</React.Fragment>
            ))}
          </div>

          {/* Comment Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{props.formatDate(comment.created_at)}</span>

            {/* ✅ UPDATED TIMESTAMP DISPLAY LOGIC */}
            <div className="flex items-center gap-2">
              {supportsTimestamps && (
                <>
                  {/* Show Range Button if it's a range comment */}
                  {isRangeComment && (
                    <button
                      onClick={handleRangeCommentClick}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-mono flex items-center gap-1 hover:bg-yellow-400/10 px-2 py-1 rounded transition-colors duration-200"
                      title="Jump to time range start"
                    >
                      <ClockIcon className="h-3 w-3" />
                      <span>
                        {props.formatTime(comment.timestamp_start_seconds!)} -{" "}
                        {props.formatTime(comment.timestamp_end_seconds!)}
                      </span>
                    </button>
                  )}

                  {/* Show Regular Timestamp Button if it's a regular timestamp comment */}
                  {isTimestampComment && (
                    <button
                      onClick={handleTimestampCommentClick}
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:bg-blue-400/10 px-2 py-1 rounded transition-colors duration-200"
                      title="Jump to timestamp"
                    >
                      <Clock className="h-3 w-3" />
                      {props.formatTime(comment.timestamp_seconds!)}
                    </button>
                  )}

                  {/* ✅ NEW: Show annotation timestamp for pins/drawings created during range selection */}
                  {!isRangeComment &&
                    !isTimestampComment &&
                    (comment.annotation_data?.timestamp !== undefined ||
                      comment.drawing_data?.timestamp !== undefined) && (
                      <button
                        onClick={() => {
                          const timestamp =
                            comment.annotation_data?.timestamp ??
                            comment.drawing_data?.timestamp;
                          if (
                            timestamp !== undefined &&
                            props.onSeekToTimestamp
                          ) {
                            props.onSeekToTimestamp(timestamp);
                          }
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 hover:bg-purple-400/10 px-2 py-1 rounded transition-colors duration-200"
                        title="Jump to annotation timestamp"
                      >
                        <Clock className="h-3 w-3" />
                        {comment.annotation_data?.timestamp !== undefined
                          ? props.formatTime(comment.annotation_data.timestamp)
                          : comment.drawing_data?.timestamp !== undefined
                            ? props.formatTime(comment.drawing_data.timestamp)
                            : "0:00"}
                      </button>
                    )}

                  {/* Show nothing if comment has no timestamp data */}
                  {!isRangeComment &&
                    !isTimestampComment &&
                    comment.annotation_data?.timestamp === undefined &&
                    comment.drawing_data?.timestamp === undefined && (
                      <span className="text-xs text-muted-foreground">
                        No timestamp
                      </span>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>
              Make changes to your comment. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="min-h-[100px]"
              disabled={isEditLoading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isEditLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditComment}
              disabled={
                !editContent.trim() ||
                editContent === comment.content ||
                isEditLoading
              }
            >
              {isEditLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 border bg-primary-foreground rounded-lg">
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Rest of the component stays the same...
const flattenComments = (comments: MediaComment[]): MediaComment[] => {
  const result: MediaComment[] = [];

  const traverse = (comment: MediaComment) => {
    result.push(comment);
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(traverse);
    }
  };

  traverse(comments[0]);
  return result;
};

export const CommentItem: React.FC<CommentItemProps> = (props) => {
  const handleAction = async (
    action: string,
    comment: MediaComment,
    data?: any
  ) => {
    switch (action) {
      case "pin":
        if (props.onPinClick) {
          // ✅ FIXED: Seek to correct timestamp for pin comments
          let seekTime = undefined;

          // Priority 1: Check annotation_data.timestamp (for pins created during range selection)
          if (comment.annotation_data?.timestamp !== undefined) {
            seekTime = comment.annotation_data.timestamp;
          }
          // Priority 2: Check regular timestamp_seconds
          else if (comment.timestamp_seconds !== undefined) {
            seekTime = comment.timestamp_seconds;
          }
          // Priority 3: Check range start timestamp
          else if (comment.timestamp_start_seconds !== undefined) {
            seekTime = comment.timestamp_start_seconds;
          }

          if (seekTime !== undefined && props.onSeekToTimestamp) {
            props.onSeekToTimestamp(seekTime);
          }

          props.onPinClick(comment);
        }
        break;

      case "drawing":
        if (props.onDrawingClick) {
          let seekTime = undefined;

          // Priority 1: Check drawing_data.timestamp (for drawings created during range selection)
          if (comment.drawing_data?.timestamp !== undefined) {
            seekTime = comment.drawing_data.timestamp;
          }
          // Priority 2: Check regular timestamp_seconds
          else if (comment.timestamp_seconds !== undefined) {
            seekTime = comment.timestamp_seconds;
          }
          // Priority 3: Check range start timestamp
          else if (comment.timestamp_start_seconds !== undefined) {
            seekTime = comment.timestamp_start_seconds;
          }
          if (seekTime !== undefined && props.onSeekToTimestamp) {
            props.onSeekToTimestamp(seekTime);
          }
          props.onDrawingClick(comment);
        }
        break;

      case "timestamp":
        if (props.onSeekToTimestamp) {
          // ✅ FIXED: Handle all possible timestamp sources
          let timestamp = data; // If data is passed, use it first

          if (timestamp === undefined) {
            // Check annotation timestamp
            if (comment.annotation_data?.timestamp !== undefined) {
              timestamp = comment.annotation_data.timestamp;
            }
            // Check drawing timestamp
            else if (comment.drawing_data?.timestamp !== undefined) {
              timestamp = comment.drawing_data.timestamp;
            }
            // Check regular timestamp
            else if (comment.timestamp_seconds !== undefined) {
              timestamp = comment.timestamp_seconds;
            }
            // Check range start timestamp
            else if (comment.timestamp_start_seconds !== undefined) {
              timestamp = comment.timestamp_start_seconds;
            } else {
              timestamp = 0; // Default fallback
            }
          }

          if (timestamp !== undefined && timestamp !== null) {
            props.onSeekToTimestamp(timestamp);
          }
        }
        break;

      case "reply":
        if (props.onReplyClick) {
          props.onReplyClick(comment);
        }
        break;

      case "edit":
        if (props.onEdit && data) {
          await props.onEdit(comment.id, data);
        }
        break;

      case "delete":
        props.onDelete(comment.id);
        break;
    }
  };

  const allComments = flattenComments([props.comment]);

  return (
    <div className="border rounded-lg p-4 bg-primary-foreground transition-colors mb-3">
      {allComments.map((comment, index) => (
        <SingleComment
          key={comment.id}
          comment={comment}
          isLast={index === allComments.length - 1}
          onAction={handleAction}
          props={{ ...props, comment }}
        />
      ))}
    </div>
  );
};
