// app/review/[token]/components/Review/useReviewComments.ts
// @ts-nocheck

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createCommentAction,
  getCommentsAction,
  deleteCommentAction,
  updateCommentAction,
} from "../../lib/actions";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  timestamp_start_seconds?: number; // ✅ ADD THIS
  timestamp_end_seconds?: number; // ✅ ADD THIS
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

interface UseReviewCommentsProps {
  mediaId: string;
  fileCategory: string;
  supportsAnnotations: boolean;
  currentTime: number;
  authenticatedUser?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  onCommentDeleted?: (commentId: string) => void;
  onCommentAdded?: (comment: MediaComment) => void;
  onAnnotationRequest?: (type: "pin" | "drawing", config: any) => void;
  onClearActiveComments?: () => void;
  projectMode?: boolean;
  projectId?: string;
  createCommentOverride?: (data: any) => Promise<any>;
  reviewToken?: string;
  reviewLinkData?: any;
  userProjectRelationship?: any;
  onRangeCommentRequest?: () => void;
  pendingRangeSelection?: { startTime: number; endTime: number } | null;
  onRangeSelectionComplete?: () => void;
  onTimelineRangeUnlock?: () => void;
}

export const useReviewComments = ({
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
}: UseReviewCommentsProps) => {
  // Basic states
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(true);
  const [replyingTo, setReplyingTo] = useState<MediaComment | null>(null);

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

  // Range comment mode state
  const [isRangeCommentMode, setIsRangeCommentMode] = useState(false);

  // Utility functions
  const getSessionId = () => {
    if (typeof window === "undefined") return null;
    let sessionId = localStorage.getItem("reviewSessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("reviewSessionId", sessionId);
    }
    return sessionId;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Utility function to nest comments
  const nestComments = (comments: MediaComment[]): MediaComment[] => {
    const commentMap = new Map<string, MediaComment>();
    const rootComments: MediaComment[] = [];

    // Initialize all comments with empty replies array
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build the nested structure
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;

      if (comment.parent_comment_id) {
        // This is a reply
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by creation date
    rootComments.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Sort replies within each comment by creation date
    const sortReplies = (comment: MediaComment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        comment.replies.forEach(sortReplies);
      }
    };

    rootComments.forEach(sortReplies);
    return rootComments;
  };

  // Load comments for this media
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

  // Load comments when media changes
  useEffect(() => {
    loadComments();
  }, [mediaId]);

  // Set up global annotation complete handler
  useEffect(() => {
    const handleAnnotationComplete = (annotationData: any) => {
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

  // Memoize the annotation request function to prevent infinite loops
  const requestAnnotation = useCallback(
    (type: "pin" | "drawing", config: any) => {
      if (onAnnotationRequest && supportsAnnotations) {
        onAnnotationRequest(type, config);
      }
    },
    [onAnnotationRequest, supportsAnnotations]
  );

  // Update annotation config when settings change
  useEffect(() => {
    if (annotationMode !== "none" && supportsAnnotations) {
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
    requestAnnotation,
    supportsAnnotations,
  ]);

  const startAnnotation = (type: "pin" | "drawing") => {
    // Early return if annotations not supported
    if (!supportsAnnotations) {
      return;
    }

    if (!authenticatedUser && !userName.trim()) {
      setShowUserForm(true);
      alert("Please enter your name first");
      return;
    }

    // Clear any existing annotation
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

    // Clear active comments from MediaInterface BEFORE setting new mode
    if (onClearActiveComments) {
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

    requestAnnotation(type, config);
  };

  const cancelAnnotation = () => {
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
    if (supportsAnnotations) {
      requestAnnotation("none" as any, {});
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

  // Handle range comment request
  const handleRangeCommentRequest = () => {
    if (!authenticatedUser && !userName.trim()) {
      setShowUserForm(true);
      alert("Please enter your name first");
      return;
    }

    // ✅ UPDATED: Clear annotation modes when entering range mode
    setAnnotationMode("none");
    setPendingAnnotation(null);
    setCurrentDrawingStrokes(0);

    // Don't clear active comments or annotations when starting range mode
    setIsRangeCommentMode(true);
    onRangeCommentRequest?.();
  };

  const cancelRangeComment = () => {
    setIsRangeCommentMode(false);
    onRangeSelectionComplete?.();
  };

  // ✅ UPDATED: Add comment function with range support
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

      // ✅ FIXED: Use range time for annotations when range is selected
      const getAnnotationTimestamp = () => {
        if (pendingRangeSelection) {
          // Use the START time of the range for pin/drawing timestamp
          return pendingRangeSelection.startTime;
        }
        if (fileCategory === "video" || fileCategory === "audio") {
          return currentTime;
        }
        return undefined;
      };

      // Only process annotation data if annotations are supported
      if (pendingAnnotation && supportsAnnotations) {
        if (pendingAnnotation.type === "pin") {
          annotationData = {
            id: pendingAnnotation.data.id,
            x: pendingAnnotation.data.x,
            y: pendingAnnotation.data.y,
            mediaWidth: pendingAnnotation.data.mediaWidth,
            mediaHeight: pendingAnnotation.data.mediaHeight,
            createdAtScale: pendingAnnotation.data.createdAtScale,
            timestamp: getAnnotationTimestamp(),
            color: pendingAnnotation.data.color || pinColor,
          };
        } else if (pendingAnnotation.type === "drawing") {
          drawingData = {
            id: pendingAnnotation.data.id,
            strokes: pendingAnnotation.data.strokes,
            timestamp: getAnnotationTimestamp(),
            mediaWidth: pendingAnnotation.data.mediaWidth,
            mediaHeight: pendingAnnotation.data.mediaHeight,
            createdAtScale: pendingAnnotation.data.createdAtScale,
          };
        }
      }

      let result;

      if (projectMode && createCommentOverride) {
        result = await createCommentOverride({
          mediaId,
          content: newComment.trim(),
          // ✅ FIXED: Use regular timestamp only if NO range is selected
          timestampSeconds:
            !pendingRangeSelection &&
            (fileCategory === "video" || fileCategory === "audio")
              ? currentTime
              : undefined,
          // ✅ FIXED: Use range timestamps when range is selected
          timestampStartSeconds: pendingRangeSelection?.startTime,
          timestampEndSeconds: pendingRangeSelection?.endTime,
          parentCommentId: replyingTo?.id,
          annotationData,
          drawingData,
        });
      } else {
        // Use review token directly instead of parsing URL
        const currentReviewToken =
          reviewToken ||
          (() => {
            const pathParts = window.location.pathname.split("/");
            return pathParts[pathParts.length - 1];
          })();

        result = await createCommentAction({
          mediaId,
          userName: authenticatedUser
            ? authenticatedUser.name || authenticatedUser.email
            : userName.trim(),
          userEmail: authenticatedUser
            ? authenticatedUser.email
            : userEmail.trim() || undefined,
          userId: authenticatedUser?.id,
          content: newComment.trim(),
          // ✅ FIXED: Use regular timestamp only if NO range is selected
          timestampSeconds:
            !pendingRangeSelection &&
            (fileCategory === "video" || fileCategory === "audio")
              ? currentTime
              : undefined,
          // ✅ FIXED: Use range timestamps when range is selected
          timestampStartSeconds: pendingRangeSelection?.startTime,
          timestampEndSeconds: pendingRangeSelection?.endTime,
          parentCommentId: replyingTo?.id,
          ipAddress: undefined,
          userAgent: navigator.userAgent,
          annotationData,
          drawingData,
          sessionId,
          reviewToken: currentReviewToken,
          projectId: projectId,
          reviewLinkData: reviewLinkData,
          userProjectRelationship: userProjectRelationship,
        });
      }

      if (result.success && result.comment) {
        setComments([...comments, result.comment]);
        onCommentAdded?.(result.comment);
        setNewComment("");
        setShowUserForm(false);
        setAnnotationMode("none");
        setPendingAnnotation(null);
        setCurrentDrawingStrokes(0);
        setReplyingTo(null);

        // ✅ FIXED: Clear range selection after successful comment
        if (pendingRangeSelection) {
          onRangeSelectionComplete?.();
          setIsRangeCommentMode(false);
          // Also unlock the timeline range
          onTimelineRangeUnlock?.();
        }

        // Only clear annotation mode if annotations supported
        if (supportsAnnotations) {
          requestAnnotation("none" as any, {});
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
    try {
      const sessionId = getSessionId();
      const result = await deleteCommentAction(commentId, sessionId);
      if (result.success) {
        // Remove comment and all its replies from state
        const filterComments = (comments: MediaComment[]): MediaComment[] => {
          return comments.filter(
            (c) => c.id !== commentId && c.parent_comment_id !== commentId
          );
        };
        setComments(filterComments(comments));
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

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const sessionId = getSessionId();
      const result = await updateCommentAction(
        commentId,
        newContent,
        sessionId
      );

      if (result.success && result.comment) {
        // Update the comment in state
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content: newContent,
                  updated_at: result.comment.updated_at,
                }
              : comment
          )
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to edit comment:", error);
      throw error;
    }
  };

  // ✅ UPDATED: Range unlock functions
  const unlockRangeFromComments = () => {
    setIsRangeCommentMode(false);
    onRangeSelectionComplete?.();
    // Also unlock the Timeline using the prop
    onTimelineRangeUnlock?.();
  };

  // Create a separate function for the Timeline to use
  const unlockTimelineRange = () => {
    setIsRangeCommentMode(false);
    onRangeSelectionComplete?.();
  };
  // ✅ ADD THIS: Expose unlockRangeFromComments to window for Timeline to call
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).unlockRangeFromComments = unlockRangeFromComments;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).unlockRangeFromComments;
      }
    };
  }, [unlockRangeFromComments]);

  return {
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
    loadComments,
    addComment,
    deleteComment,
    handleEditComment,
    startAnnotation,
    cancelAnnotation,
    saveAnnotation,
    undoDrawing,
    handleRangeCommentRequest,
    cancelRangeComment,
    canDeleteComment,
    formatTime,
    nestComments,
    unlockRangeFromComments,
    unlockTimelineRange,
  };
};
