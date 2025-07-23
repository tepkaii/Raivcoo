// app/review/[token]/components/Review/ReviewComments.tsx
// @ts-nocheck
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Undo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "./CommentItem";
import {
  ChatBubbleOvalLeftIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReviewComments } from "./useReviewComments";
import { formatDate, getFileCategory } from "@/app/dashboard/utilities";
import { colors, shapeOptions, thicknessOptions } from "./utilities";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  timestamp_start_seconds?: number;
  timestamp_end_seconds?: number;
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
  avatar_url?: string;
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

interface ReviewCommentsProps {
  mediaId: string;
  mediaType: "video" | "image" | "audio" | "document" | "svg";
  media?: any;
  currentTime?: number;
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
  onCommentPinClick?: (comment: MediaComment) => void;
  onCommentDrawingClick?: (comment: MediaComment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentAdded?: (comment: MediaComment) => void;
  onAnnotationRequest?: (type: "pin" | "drawing", config: any) => void;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  onClearActiveComments?: () => void;
  activeCommentPin?: string | null;
  activeCommentDrawing?: string | null;
  projectMode?: boolean;
  projectId?: string;
  createCommentOverride?: (data: any) => Promise<any>;
  userPermissions?: {
    canComment?: boolean;
    canEditStatus?: boolean;
  };
  userProjectRelationship?: {
    role: string;
    isOwner: boolean;
    isMember?: boolean;
    isOutsider?: boolean;
  } | null;
  reviewToken?: string;
  reviewLinkData?: any;
  onRangeCommentRequest?: () => void;
  pendingRangeSelection?: { startTime: number; endTime: number } | null;
  onRangeSelectionComplete?: () => void;
  onTimelineRangeUnlock?: () => void;
}

export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  mediaId,
  mediaType,
  media,
  currentTime = 0,
  onSeekToTimestamp,
  className = "",
  onCommentPinClick,
  onCommentDrawingClick,
  onCommentDeleted,
  onCommentAdded,
  onAnnotationRequest,
  authenticatedUser,
  onClearActiveComments,
  activeCommentPin,
  activeCommentDrawing,
  projectMode = false,
  projectId,
  createCommentOverride,
  userProjectRelationship,
  reviewToken,
  reviewLinkData,
  onRangeCommentRequest,
  pendingRangeSelection,
  onRangeSelectionComplete,
  onTimelineRangeUnlock,
}) => {
  const fileCategory = media
    ? getFileCategory(media.file_type, media.mime_type)
    : mediaType;

  const supportsAnnotations =
    fileCategory === "image" || fileCategory === "video";

  const {
    // State
    comments,
    newComment,
    userName,
    userEmail,
    isLoading,
    isSubmitting,
    showUserForm,
    replyingTo,
    annotationMode,
    pinColor,
    drawingColor,
    drawingThickness,
    drawingShape,
    pendingAnnotation,
    currentDrawingStrokes,
    isRangeCommentMode,

    // Setters
    setNewComment,
    setUserName,
    setUserEmail,
    setShowUserForm,
    setReplyingTo,
    setPinColor,
    setDrawingColor,
    setDrawingThickness,
    setDrawingShape,

    // Methods
    addComment,
    deleteComment,
    handleEditComment,
    startAnnotation,
    cancelAnnotation,
    saveAnnotation,
    undoDrawing,
    handleRangeCommentRequest,
    canDeleteComment,
    formatTime,
    nestComments,
    unlockRangeFromComments,
  } = useReviewComments({
    mediaId,
    fileCategory,
    supportsAnnotations,
    currentTime,
    authenticatedUser,
    onCommentDeleted,
    onCommentAdded,
    onAnnotationRequest,
    onClearActiveComments,
    projectMode,
    projectId,
    createCommentOverride,
    reviewToken,
    reviewLinkData,
    userProjectRelationship,
    onRangeCommentRequest,
    pendingRangeSelection,
    onRangeSelectionComplete,
    onTimelineRangeUnlock,
  });

  // Handle reply button click - sets reply mode
  const handleReplyClick = (comment: MediaComment) => {
    setReplyingTo(comment);
    const textarea = document.querySelector(
      'textarea[placeholder*="comment"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      </div>
    );
  }

  const nestedComments = nestComments(comments);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {nestedComments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ChatBubbleOvalLeftIcon className="h-8 w-8 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Start the conversation
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {nestedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                mediaType={mediaType}
                media={media}
                currentTime={currentTime}
                onSeekToTimestamp={onSeekToTimestamp}
                onDelete={deleteComment}
                onPinClick={onCommentPinClick}
                onDrawingClick={onCommentDrawingClick}
                onReplyClick={handleReplyClick}
                formatTime={formatTime}
                formatDate={formatDate}
                canDelete={canDeleteComment(comment)}
                onEdit={handleEditComment}
                canEdit={canDeleteComment(comment)}
                isActivePinComment={activeCommentPin === comment.id}
                isActiveDrawingComment={activeCommentDrawing === comment.id}
                authenticatedUser={authenticatedUser}
                replyingTo={replyingTo?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t">
        <div className="p-3 space-y-2">
          {/* User Info Form - only show for non-authenticated users */}
          {!authenticatedUser && showUserForm && (
            <div className="space-y-2 p-3 bg-primary-foreground rounded-lg border">
              <div className="text-xs mb-2">Enter your details to comment:</div>
              <Input
                type="text"
                placeholder="Your name *"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="bg-background h-8"
              />
              <Input
                type="email"
                placeholder="Your email (optional)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="bg-background h-8"
              />
            </div>
          )}

          {/* Reply Context */}
          {replyingTo && (
            <div className="flex gap-1 items-center bg-blue-500/10 border border-blue-500/30 rounded-full p-2">
              <div className="text-xs text-blue-400">
                Replying to{" "}
                <span className="font-medium">{replyingTo.user_name}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-white"
                title="Cancel reply"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* ✅ UPDATED: Range Selection Context - Updated Blue Style */}
          {pendingRangeSelection && (
            <div className="flex gap-1 items-center bg-blue-500/10 border border-blue-500/30 rounded-full p-2">
              <ClockIcon className="h-3 w-3 text-blue-400" />
              <div className="text-xs text-blue-400 font-medium">
                {formatTime(pendingRangeSelection.startTime)} -{" "}
                {formatTime(pendingRangeSelection.endTime)}
              </div>
              <button
                onClick={unlockRangeFromComments} // ✅ This should work
                className="ml-auto text-xs text-blue-400 hover:text-blue-300"
                title="Remove range lock"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Textarea with Post Button */}
          <div className="flex items-center gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.user_name}...`
                  : pendingRangeSelection
                    ? `Comment on ${formatTime(pendingRangeSelection.startTime)} - ${formatTime(pendingRangeSelection.endTime)}...`
                    : "Add a comment..."
              }
              className="flex-1 min-h-[36px] rounded-full max-h-[120px] resize-none bg-background border-none focus:ring-0"
              disabled={isSubmitting}
              rows={1}
            />

            <Button
              size="sm"
              onClick={
                annotationMode !== "none" && pendingAnnotation
                  ? saveAnnotation
                  : addComment
              }
              className="h-8 w-8 p-0"
              disabled={
                !newComment.trim() ||
                isSubmitting ||
                (!authenticatedUser && !userName.trim())
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Second Line - Smooth Height-Based Transitions */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {/* ✅ UPDATED: Always show annotation buttons when NOT in annotation mode - Allow use with range */}
              {annotationMode === "none" && (
                <motion.div
                  key="annotation-buttons"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {supportsAnnotations && (
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => startAnnotation("pin")}
                            disabled={isSubmitting}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Add pin annotation"
                          >
                            <MapPinIcon className="w-4 h-4" />
                          </Button>

                          <Button
                            onClick={() => startAnnotation("drawing")}
                            disabled={isSubmitting}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Add drawing annotation"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Range comment button for video/audio */}
                      {(fileCategory === "video" ||
                        fileCategory === "audio") && (
                        <Button
                          onClick={handleRangeCommentRequest}
                          disabled={isSubmitting || isRangeCommentMode}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Add time range comment"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Guest user name change option */}
                      {!authenticatedUser && !showUserForm && userName && (
                        <button
                          onClick={() => setShowUserForm(true)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Change name ({userName})
                        </button>
                      )}
                    </div>

                    {/* ✅ UPDATED: Right side timestamp/range info with X button */}
                    <div className="flex items-center gap-2">
                      {(fileCategory === "video" ||
                        fileCategory === "audio") && (
                        <>
                          {/* ✅ Show range info when range is active, otherwise show current time */}
                          {isRangeCommentMode && !pendingRangeSelection ? (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <ClockIcon className="h-3 w-3" />
                              <span className="font-medium">Select range</span>
                              <button
                                onClick={unlockRangeFromComments} // ✅ This should work
                                className="ml-1 hover:text-blue-300"
                                title="Cancel range selection"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : pendingRangeSelection ? (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <ClockIcon className="h-3 w-3" />
                              <span className="font-medium">
                                {formatTime(pendingRangeSelection.startTime)} -{" "}
                                {formatTime(pendingRangeSelection.endTime)}
                              </span>
                              <button
                                onClick={unlockRangeFromComments} // ✅ This should work
                                className="ml-1 hover:text-blue-300"
                                title="Remove range selection"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-blue-400">
                              At {formatTime(currentTime)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {annotationMode !== "none" && supportsAnnotations && (
                <motion.div
                  key="annotation-settings"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {annotationMode === "pin" && (
                        <div className="flex items-center gap-2">
                          <Select value={pinColor} onValueChange={setPinColor}>
                            <SelectTrigger className="h-8 w-16 rounded-full">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-400"
                                style={{ backgroundColor: pinColor }}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {colors.map((color) => (
                                <SelectItem
                                  key={color.value}
                                  value={color.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-400"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {annotationMode === "drawing" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={drawingColor}
                            onValueChange={setDrawingColor}
                          >
                            <SelectTrigger className="h-8 w-16 rounded-full">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-400"
                                style={{ backgroundColor: drawingColor }}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {colors.map((color) => (
                                <SelectItem
                                  key={color.value}
                                  value={color.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-400"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={drawingThickness.toString()}
                            onValueChange={(value) =>
                              setDrawingThickness(Number(value))
                            }
                          >
                            <SelectTrigger className="h-8 w-16 rounded-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {thicknessOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={drawingShape}
                            onValueChange={(value) =>
                              setDrawingShape(value as any)
                            }
                          >
                            <SelectTrigger className="h-8 w-16 rounded-full">
                              <div className="flex items-center justify-center">
                                {React.createElement(
                                  shapeOptions.find(
                                    (s) => s.value === drawingShape
                                  )?.icon || PencilIcon,
                                  { className: "w-3 h-3" }
                                )}
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {shapeOptions.map((shape) => (
                                <SelectItem
                                  key={shape.value}
                                  value={shape.value}
                                >
                                  <div className="flex items-center gap-2">
                                    {React.createElement(shape.icon, {
                                      className: "w-3 h-3",
                                    })}
                                    <span>{shape.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {currentDrawingStrokes > 0 && (
                            <Button
                              onClick={undoDrawing}
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Undo last stroke"
                            >
                              <Undo className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ✅ UPDATED: Show range/time info in annotation mode too */}
                    <div className="flex items-center gap-2">
                      {/* Cancel button */}
                      <Button
                        onClick={cancelAnnotation}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="Cancel annotation"
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      {/* Time/Range info */}
                      {(fileCategory === "video" ||
                        fileCategory === "audio") && (
                        <>
                          {pendingRangeSelection ? (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <ClockIcon className="h-3 w-3" />
                              <span className="font-medium">
                                {formatTime(pendingRangeSelection.startTime)} -{" "}
                                {formatTime(pendingRangeSelection.endTime)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-blue-400">
                              At {formatTime(currentTime)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
