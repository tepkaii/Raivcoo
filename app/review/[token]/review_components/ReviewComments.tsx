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
  onClearActiveComments?: () => void; // Add this line
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

  // Update annotation config when settings change
  useEffect(() => {
    if (annotationMode !== "none" && onAnnotationRequest) {
      const config =
        annotationMode === "pin"
          ? { color: pinColor }
          : {
              color: drawingColor,
              thickness: drawingThickness,
              shape: drawingShape,
            };

      // Send updated config to the annotation tools
      onAnnotationRequest(annotationMode, config);
    }
  }, [
    pinColor,
    drawingColor,
    drawingThickness,
    drawingShape,
    annotationMode,
    onAnnotationRequest,
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

    console.log(`Starting ${type} annotation`); // Debug log

    // Clear any existing annotation
    setPendingAnnotation(null);
    setCurrentDrawingStrokes(0);

    // Clear any current pin or drawing from the tools
    if (typeof window !== "undefined") {
      // Clear drawing tool
      if ((window as any).clearCurrentDrawing) {
        console.log("Clearing current drawing before starting new annotation"); // Debug log
        (window as any).clearCurrentDrawing();
      }
      // Clear pin tool
      if ((window as any).clearCurrentPin) {
        console.log("Clearing current pin before starting new annotation"); // Debug log
        (window as any).clearCurrentPin();
      }
    }

    // Clear active comments from MediaInterface BEFORE setting new mode
    if (onClearActiveComments) {
      console.log("Clearing active comments before starting new annotation"); // Debug log
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

    console.log(`Starting ${type} annotation with config:`, config); // Debug log
    onAnnotationRequest?.(type, config);
  };
  const cancelAnnotation = () => {
    console.log("Canceling annotation mode"); // Debug log

    setAnnotationMode("none");
    setPendingAnnotation(null);
    setCurrentDrawingStrokes(0);

    // Clear any current pin or drawing from the tools
    if (typeof window !== "undefined") {
      // Clear drawing tool
      if ((window as any).clearCurrentDrawing) {
        (window as any).clearCurrentDrawing();
      }
      // Clear pin tool
      if ((window as any).clearCurrentPin) {
        (window as any).clearCurrentPin();
      }
    }

    // Clear active comments from MediaInterface
    if (onClearActiveComments) {
      onClearActiveComments();
    }

    // Notify annotation tools to cancel - THIS IS CRITICAL
    if (onAnnotationRequest) {
      onAnnotationRequest("none" as any, {});
    }
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
        onAnnotationRequest?.("none" as any, {});
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

  // Color options
  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
    "#000000",
  ];

  // Drawing options
  const thicknesses = [2, 3, 4, 6];
  const shapes = [
    { value: "freehand", icon: Pencil, label: "Draw" },
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-12 px-4">
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
          {/* Annotation Mode Alert */}
          {annotationMode !== "none" && (
            <div
              className={`p-3 border rounded-lg ${
                annotationMode === "pin"
                  ? "bg-purple-600/20 border-purple-600/50"
                  : "bg-green-600/20 border-green-600/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`flex items-center gap-2 ${
                    annotationMode === "pin"
                      ? "text-purple-300"
                      : "text-green-300"
                  }`}
                >
                  {annotationMode === "pin" ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    Click on the media to{" "}
                    {annotationMode === "pin" ? "place pin" : "draw"}
                  </span>
                </div>
              </div>

              {/* Annotation Controls */}
              {annotationMode === "pin" ? (
                <div className="space-y-2">
                  <div className="text-xs text-purple-200 mb-1">Pin Color:</div>
                  <div className="flex gap-1">
                    {colors.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => setPinColor(color)}
                        className={`w-6 h-6 rounded border-2 ${
                          pinColor === color
                            ? "border-white"
                            : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-green-200 mb-1">
                    Drawing Options:
                  </div>

                  {/* Colors */}
                  <div className="flex gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawingColor(color)}
                        className={`w-5 h-5 rounded border-2 ${
                          drawingColor === color
                            ? "border-white"
                            : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Thickness */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-200">Thickness:</span>
                    <div className="flex gap-1">
                      {thicknesses.map((thickness) => (
                        <button
                          key={thickness}
                          onClick={() => setDrawingThickness(thickness)}
                          className={`px-2 py-1 rounded text-xs ${
                            drawingThickness === thickness
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {thickness}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shapes */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-200">Shape:</span>
                    <div className="flex gap-1">
                      {shapes.map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setDrawingShape(value)}
                          className={`p-1 rounded text-xs ${
                            drawingShape === value
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                          title={value}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                    {annotationMode === "drawing" &&
                      currentDrawingStrokes > 0 && (
                        <button
                          onClick={undoDrawing}
                          className="p-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                          title="Undo last stroke"
                        >
                          <Undo className="w-3 h-3" />
                        </button>
                      )}
                  </div>

                  {currentDrawingStrokes > 0 && (
                    <div className="text-xs text-green-200">
                      {currentDrawingStrokes} stroke
                      {currentDrawingStrokes !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show pending annotation notice */}
          {pendingAnnotation && (
            <div className="p-2 bg-blue-600/20 border border-blue-600/50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-300">
                {pendingAnnotation.type === "pin" ? (
                  <MapPin className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {pendingAnnotation.type === "pin" ? "Pin" : "Drawing"} placed!
                  {newComment.trim()
                    ? ' Click "Save" to save.'
                    : " Add comment text to save."}
                </span>
              </div>
            </div>
          )}

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
            <div className="text-xs text-muted-foreground">
              Commenting as: {authenticatedUser.name || authenticatedUser.email}
            </div>
          )}

          {/* Comment Text Area */}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="bg-primary-foreground"
            rows={2}
            disabled={isSubmitting}
          />

          {/* Annotation Tools */}
          {annotationMode === "none" && (
            <div className="flex gap-2">
              <RevButtons
                onClick={() => startAnnotation("pin")}
                disabled={isSubmitting}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: pinColor }}
                />
                Pin
              </RevButtons>

              <RevButtons
                onClick={() => startAnnotation("drawing")}
                disabled={isSubmitting}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: drawingColor }}
                />
                Draw
              </RevButtons>
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {mediaType === "video" && annotationMode === "none" && (
                <span className="text-xs text-muted-foreground">
                  At {formatTime(currentTime)}
                </span>
              )}

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
                    <RevButtons
                      onClick={saveAnnotation}
                      disabled={!newComment.trim() || isSubmitting}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </RevButtons>
                  )}
                  <RevButtons
                    onClick={cancelAnnotation}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </RevButtons>
                </>
              ) : (
                <RevButtons
                  onClick={addComment}
                  disabled={
                    !newComment.trim() ||
                    isSubmitting ||
                    (!authenticatedUser && !userName.trim())
                  }
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
