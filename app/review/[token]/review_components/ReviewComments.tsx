// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  Loader2,
  Pencil,
  X,
  Undo,
  Circle,
  Square,
  ArrowRight,
  Minus,
} from "lucide-react";
import {
  createCommentAction,
  getCommentsAction,
  deleteCommentAction,
} from "../lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "./CommentItem";
import {
  ChatBubbleOvalLeftIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  mediaId,
  mediaType,
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
}) => {
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(true);

  // Annotation states
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "pin" | "drawing"
  >("none");
  const [pinColor, setPinColor] = useState("#ff0000");
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [drawingThickness, setDrawingThickness] = useState(3);
  const [drawingShape, setDrawingShape] = useState<
    "freehand" | "line" | "circle" | "square" | "arrow"
  >("freehand");
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);
  const [currentDrawingStrokes, setCurrentDrawingStrokes] = useState(0);

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
      setUserName(authenticatedUser.name || authenticatedUser.email);
      setUserEmail(authenticatedUser.email);
      setShowUserForm(false);
    } else {
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

  // Set up global annotation complete handler
  useEffect(() => {
    const handleAnnotationComplete = (annotationData: any) => {
      console.log("Annotation completed:", annotationData);
      setPendingAnnotation(annotationData);
      if (annotationData.type === "drawing") {
        setCurrentDrawingStrokes(annotationData.data.strokes?.length || 0);
      }
    };

    if (typeof window !== "undefined") {
      (window as any).handleAnnotationComplete = handleAnnotationComplete;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).handleAnnotationComplete;
      }
    };
  }, []);

  // FIXED: Memoize the annotation request function to prevent infinite loops
  const requestAnnotation = useCallback(
    (type: "pin" | "drawing", config: any) => {
      if (onAnnotationRequest) {
        onAnnotationRequest(type, config);
      }
    },
    [onAnnotationRequest]
  );

  // FIXED: Update annotation config when settings change - now with proper dependencies
  useEffect(() => {
    if (annotationMode !== "none") {
      const config =
        annotationMode === "pin"
          ? { color: pinColor }
          : {
              color: drawingColor,
              thickness: drawingThickness,
              shape: drawingShape,
            };

      // Send updated config to the annotation tools
      requestAnnotation(annotationMode, config);
    }
  }, [
    pinColor,
    drawingColor,
    drawingThickness,
    drawingShape,
    annotationMode,
    requestAnnotation, // Now using the memoized function
  ]);

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

  const startAnnotation = (type: "pin" | "drawing") => {
    if (!authenticatedUser && !userName.trim()) {
      setShowUserForm(true);
      alert("Please enter your name first");
      return;
    }

    console.log(`Starting ${type} annotation`);

    // Clear any existing annotation
    setPendingAnnotation(null);
    setCurrentDrawingStrokes(0);

    // Clear any current pin or drawing from the tools
    if (typeof window !== "undefined") {
      if ((window as any).clearCurrentDrawing) {
        console.log("Clearing current drawing before starting new annotation");
        (window as any).clearCurrentDrawing();
      }
      if ((window as any).clearCurrentPin) {
        console.log("Clearing current pin before starting new annotation");
        (window as any).clearCurrentPin();
      }
    }

    // Clear active comments from MediaInterface BEFORE setting new mode
    if (onClearActiveComments) {
      console.log("Clearing active comments before starting new annotation");
      onClearActiveComments();
    }

    // Set annotation mode
    setAnnotationMode(type);

    const config =
      type === "pin"
        ? { color: pinColor }
        : {
            color: drawingColor,
            thickness: drawingThickness,
            shape: drawingShape,
          };

    console.log(`Starting ${type} annotation with config:`, config);
    requestAnnotation(type, config);
  };

  const cancelAnnotation = () => {
    console.log("Canceling annotation mode");

    setAnnotationMode("none");
    setPendingAnnotation(null);
    setCurrentDrawingStrokes(0);

    // Clear any current pin or drawing from the tools
    if (typeof window !== "undefined") {
      if ((window as any).clearCurrentDrawing) {
        (window as any).clearCurrentDrawing();
      }
      if ((window as any).clearCurrentPin) {
        (window as any).clearCurrentPin();
      }
    }

    // Clear active comments from MediaInterface
    if (onClearActiveComments) {
      onClearActiveComments();
    }

    // Notify annotation tools to cancel
    requestAnnotation("none" as any, {});
  };

  const saveAnnotation = () => {
    if (pendingAnnotation && newComment.trim()) {
      addComment();
    } else if (pendingAnnotation && !newComment.trim()) {
      alert("Please add a comment to save the annotation");
    }
  };

  const undoDrawing = () => {
    if (typeof window !== "undefined" && (window as any).undoLastStroke) {
      (window as any).undoLastStroke();
      setCurrentDrawingStrokes(Math.max(0, currentDrawingStrokes - 1));
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    if (!authenticatedUser && !userName.trim()) {
      setShowUserForm(true);
      return;
    }

    try {
      setIsSubmitting(true);

      if (!authenticatedUser) {
        localStorage.setItem("reviewUserName", userName);
        if (userEmail) {
          localStorage.setItem("reviewUserEmail", userEmail);
        }
      }

      const sessionId = getSessionId();

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
            color: pendingAnnotation.data.color || pinColor,
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
        setAnnotationMode("none");
        setPendingAnnotation(null);
        setCurrentDrawingStrokes(0);

        // Notify annotation tools to cancel
        requestAnnotation("none" as any, {});
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

  const canDeleteComment = (comment: MediaComment) => {
    if (authenticatedUser) {
      return comment.user_id === authenticatedUser.id;
    } else {
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

  // Color options with visual representation
  const colors = [
    { value: "#E5484D", name: "Red" },
    { value: "#46A758", name: "Green" },
    { value: "#0070F3", name: "Blue" },
    { value: "#FFB224", name: "amber" },
    { value: "#8E4EC6", name: "Purple" },
    { value: "#00B8D4", name: "Cyan" },
    { value: "#000000", name: "Black" },
  ];

  // Drawing thickness options
  const thicknessOptions = [
    { value: 2, label: "2px" },
    { value: 3, label: "3px" },
    { value: 4, label: "4px" },
    { value: 6, label: "6px" },
    { value: 8, label: "8px" },
  ];

  // Drawing shape options with icons
  const shapeOptions = [
    { value: "freehand", icon: PencilIcon, label: "Freehand" },
    { value: "line", icon: Minus, label: "Line" },
    { value: "circle", icon: Circle, label: "Circle" },
    { value: "square", icon: Square, label: "Square" },
    { value: "arrow", icon: ArrowRight, label: "Arrow" },
  ] as const;

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

  return (
    <div className={`flex flex-col  h-full ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ChatBubbleOvalLeftIcon className="h-8 w-8 mx-auto mb-3 opacity-50 text-muted-foreground" />
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
                isActivePinComment={activeCommentPin === comment.id}
                isActiveDrawingComment={activeCommentDrawing === comment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border p-4">
        <div className="space-y-2">
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
            <div className="flex gap-1 items-center ">
              <div className="text-xs text-muted-foreground">
                Commenting as:{" "}
                {authenticatedUser.name || authenticatedUser.email}
              </div>
              {mediaType === "video" && annotationMode === "none" && (
                <span className="text-xs  px-[3px] py-[2px] bg-blue-700/50 text-blue-100">
                  At {formatTime(currentTime)}
                </span>
              )}{" "}
            </div>
          )}

          {/* Comment Text Area */}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="bg-primary-foreground"
            rows={1}
            disabled={isSubmitting}
          />

          {/* Compact Annotation Controls - Only show when in annotation mode */}
          {annotationMode === "pin" && (
            <div className="flex items-center gap-3 text-sm">
              <Select
                value={pinColor}
                onValueChange={(value) => setPinColor(value)}
              >
                <SelectTrigger className="w-8 h-8 hover:bg-secondary/70 bg-transparent border-transparent flex justify-center items-center">
                  <div className="flex justify-center items-center">
                    <div
                      className="size-5 rounded-[5px] border-2 border-white"
                      style={{ backgroundColor: pinColor }}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
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
            <div className="flex text-sm flex-wrap">
              {/* Color Selector */}
              <Select
                value={drawingColor}
                onValueChange={(value) => setDrawingColor(value)}
              >
                <SelectTrigger className="w-8 h-8 flex justify-center bg-transparent border-transparent items-center">
                  <div className="flex justify-center items-center">
                    <div
                      className="size-5 rounded-[5px] border-2 border-white"
                      style={{ backgroundColor: drawingColor }}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
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

              {/* Thickness Selector */}
              <Select
                value={drawingThickness.toString()}
                onValueChange={(value) => setDrawingThickness(Number(value))}
              >
                <SelectTrigger className="w-20 h-8 hover:bg-secondary/70 bg-transparent border-transparent ">
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

              {/* Shape Selector */}
              <Select
                value={drawingShape}
                onValueChange={(value) => setDrawingShape(value as any)}
              >
                <SelectTrigger className="w-16 h-8 hover:bg-secondary/70 bg-transparent border-transparent ">
                  <div className="flex items-center justify-center">
                    {React.createElement(
                      shapeOptions.find((s) => s.value === drawingShape)
                        ?.icon || Pencil,
                      { className: "w-3 h-3" }
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {shapeOptions.map((shape) => (
                    <SelectItem key={shape.value} value={shape.value}>
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

              {/* Undo button */}
              {currentDrawingStrokes > 0 && (
                <Button
                  onClick={undoDrawing}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                >
                  <Undo className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Annotation Tools - Only show when NOT in annotation mode */}
          {annotationMode === "none" && (
            <div className="flex gap-2">
              <Button
                onClick={() => startAnnotation("pin")}
                disabled={isSubmitting}
                size="sm"
                variant="ghost"
                className="h-8 px-2"
              >
                <MapPinIcon className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => startAnnotation("drawing")}
                disabled={isSubmitting}
                size="sm"
                variant="ghost"
                className="h-8 px-2"
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
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
              {annotationMode !== "none" ? (
                <>
                  {pendingAnnotation && (
                    <Button
                      onClick={saveAnnotation}
                      disabled={!newComment.trim() || isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={cancelAnnotation}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={addComment}
                  disabled={
                    !newComment.trim() ||
                    isSubmitting ||
                    (!authenticatedUser && !userName.trim())
                  }
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                      Post
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
