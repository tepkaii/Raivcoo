// app/projects/[projectId]/review/[trackId]/ReviewPage.tsx
"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  Play,
  Check,
  Edit,
  ThumbsUp,
  MessageSquareWarning,
  ShieldAlert,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation"; // For potential redirects or refreshes

// Interface for comment data USED in this component
interface Comment {
  id: string;
  timestamp: number;
  comment: string;
  created_at: string;
  commenter_display_name: string; // Name/Email derived in wrapper
  isOwnComment?: boolean; // Optional flag
}

// Props expected by the ReviewPage client component
interface ReviewPageProps {
  currentUserEmail: string; // Logged-in user's email (for display/confirmation)
  track: {
    id: string;
    projectId: string;
    roundNumber: number;
    clientDecision: "pending" | "approved" | "revisions_requested";
  };
  project: {
    id: string;
    title: string;
  };
  clientName: string | null;
  deliverableLink: string;
  initialComments: Comment[];

  // Server actions passed down
  addCommentAction: (
    trackId: string,
    timestamp: number,
    comment: string
  ) => Promise<any>;
  approveProjectAction: (projectId: string, trackId: string) => Promise<any>;
  requestRevisionsAction: (trackId: string) => Promise<any>;
}

export default function ReviewPage({
  currentUserEmail,
  track,
  project,
  clientName,
  deliverableLink,
  initialComments,
  addCommentAction,
  approveProjectAction,
  requestRevisionsAction,
}: ReviewPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition(); // For loading states during server actions
  const [comments, setComments] = useState<Comment[]>(initialComments); // Manage comments locally
  const [commentText, setCommentText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Derived state based on track prop
  const isDecisionMade = track.clientDecision !== "pending";

  // Update local comments state if initialComments prop changes (e.g., after SSR refresh)
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // --- Utility Functions ---
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(console.error); // Play and catch potential errors
    }
  };

  // --- Action Handlers ---

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || isPending || isDecisionMade) return;

    startTransition(async () => {
      try {
        const result = await addCommentAction(
          track.id,
          currentTime,
          commentText
        );
        // For now, simple toast and let revalidation handle refresh
        toast({
          title: "Success",
          description: "Comment added successfully!",
          variant: "success",
        });
        setCommentText(""); // Clear input
        router.refresh(); // Trigger server data refetch and re-render
        /* // Optimistic UI update example:
           const newComment = { ...result.comment, commenter_display_name: currentUserEmail, isOwnComment: true }; // Format based on action return
           setComments(prev => [...prev, newComment].sort((a, b) => a.timestamp - b.timestamp));
        */
      } catch (error: any) {
        console.error("Error submitting comment:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to add comment.",
          variant: "destructive",
        });
      }
    });
  };

  const handleApprove = () => {
    if (isPending || isDecisionMade) return;

    // Optional confirmation
    if (
      !confirm(
        `Are you sure you want to approve the entire project "${project.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await approveProjectAction(project.id, track.id);
        toast({
          title: "Project Approved!",
          description: "Thank you! The editor has been notified.",
          variant: "success",
        });
        // Refresh page to show updated status
        router.refresh();
      } catch (error: any) {
        console.error("Error approving project:", error);
        toast({
          title: "Approval Failed",
          description: error.message || "Could not approve the project.",
          variant: "destructive",
        });
      }
    });
  };

  const handleRequestRevisions = () => {
    if (isPending || isDecisionMade) return;

    // Warn if no comments are present
    if (
      comments.length === 0 &&
      !confirm(
        "You haven't left any feedback comments. Are you sure you want to request revisions without specific notes? The editor might need clarification."
      )
    ) {
      return;
    }
    // Standard confirmation
    else if (
      !confirm(
        `Request revisions for Round ${track.roundNumber}? This will start a new revision round based on your feedback.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await requestRevisionsAction(track.id);
        toast({
          title: "Revisions Requested",
          description: `Round ${track.roundNumber + 1} has been initiated. The editor will address your feedback.`,
          variant: "success",
        });
        // Refresh page to show updated status
        router.refresh();
      } catch (error: any) {
        console.error("Error requesting revisions:", error);
        toast({
          title: "Request Failed",
          description: error.message || "Could not request revisions.",
          variant: "destructive",
        });
      }
    });
  };

  // --- Video/Deliverable Rendering Logic ---
  // Robust check for various video/audio types or external links
  const isYoutubeLink = /youtu\.?be/.test(deliverableLink); // Basic YouTube check
  const isVimeoLink = /vimeo\.com/.test(deliverableLink); // Basic Vimeo check
  const isVideoFile = /\.(mp4|webm|ogg|mov|avi|mkv|wmv)$/i.test(
    deliverableLink
  ); // Common video formats
  const isAudioFile = /\.(mp3|wav|ogg|aac|flac)$/i.test(deliverableLink); // Common audio formats

  let youtubeEmbedUrl = "";
  let vimeoEmbedUrl = "";

  if (isYoutubeLink) {
    try {
      const urlObj = new URL(deliverableLink);
      let videoId = urlObj.searchParams.get("v");
      // Handle youtu.be short links
      if (!videoId && urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.substring(1);
      }
      if (videoId) {
        youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
  } else if (isVimeoLink) {
    try {
      const urlObj = new URL(deliverableLink);
      const videoId = urlObj.pathname.split("/").pop(); // Get last part of path
      if (videoId && /^\d+$/.test(videoId)) {
        // Check if it looks like a Vimeo ID
        vimeoEmbedUrl = `http://vimeo.com/3{videoId}`;
      }
    } catch (e) {
      console.error("Error parsing Vimeo URL:", e);
    }
  }

  // --- Component Return ---
  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
      {" "}
      {/* Responsive width */}
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            {project.title} - Round {track.roundNumber} Review
          </CardTitle>
          <CardDescription>
            Deliverable review for {clientName || currentUserEmail}. Please
            provide feedback below.
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Main Content Card (Video + Comment Input) */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Video/Deliverable Display */}
          <div className="rounded-lg overflow-hidden border bg-black">
            {youtubeEmbedUrl ? (
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : vimeoEmbedUrl ? (
              <div className="aspect-video">
                <iframe
                  src={vimeoEmbedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo video player"
                ></iframe>
              </div>
            ) : isVideoFile ? (
              <video
                ref={videoRef}
                className="w-full aspect-video block"
                controls
                onTimeUpdate={handleTimeUpdate}
                src={deliverableLink}
              />
            ) : isAudioFile ? (
              <div className="p-4 bg-gray-800">
                {" "}
                {/* Audio player styling */}
                <audio
                  ref={videoRef as any}
                  className="w-full"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  src={deliverableLink}
                />
              </div>
            ) : (
              <div className="p-6 bg-secondary flex flex-col items-center text-center min-h-[200px] sm:min-h-[300px] justify-center">
                <MessageSquareWarning className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-secondary-foreground font-medium mb-1">
                  Cannot preview this deliverable directly.
                </p>
                <a
                  href={deliverableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
                >
                  View/Download Deliverable <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Decision Display (if already made) */}
          {isDecisionMade && (
            <div
              className={`p-4 rounded-md border ${track.clientDecision === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <div className="flex items-center gap-2">
                {track.clientDecision === "approved" ? (
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                )}
                <p
                  className={`font-semibold ${track.clientDecision === "approved" ? "text-green-800" : "text-red-800"}`}
                >
                  {track.clientDecision === "approved"
                    ? "Project Approved"
                    : "Revisions Requested"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1 pl-7">
                {track.clientDecision === "approved"
                  ? "Thank you! No further action needed for this project."
                  : "The editor has been notified. A new round will address your feedback."}
              </p>
            </div>
          )}

          {/* Comment Input Area - Hide if decision made */}
          {!isDecisionMade && (
            <form onSubmit={handleSubmitComment} className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Add feedback at:{" "}
                {formatTime(currentTime)}
              </div>
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Enter your feedback here..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                  rows={3}
                  disabled={isPending || isDecisionMade}
                  required
                  aria-label="Feedback comment input"
                />
                <RevButtons
                  type="submit"
                  variant="default" // Use default variant
                  size="lg"
                  disabled={isPending || !commentText.trim() || isDecisionMade}
                  aria-label="Add feedback comment"
                >
                  {isPending && !track.clientDecision ? ( // Show loader only if submitting comment
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Add</span>
                </RevButtons>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      {/* Comments Display Area */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback History ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No feedback comments yet for this round.
            </p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
              {" "}
              {/* Scrollable comments */}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 border rounded-md ${comment.isOwnComment ? "bg-blue-50/50 border-blue-200" : "bg-muted/50"}`}
                >
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Consider adding user avatar here */}
                      <p className="font-medium text-sm">
                        {comment.commenter_display_name}{" "}
                        {comment.isOwnComment ? "(You)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        at {formatTime(comment.timestamp)}
                        {/* Add Jump button only for video/audio */}
                        {(isVideoFile || isAudioFile) && videoRef.current && (
                          <button
                            onClick={() => jumpToTime(comment.timestamp)}
                            className="ml-2 inline-flex items-center text-primary hover:underline text-xs"
                            title={`Jump to ${formatTime(comment.timestamp)}`}
                          >
                            <Play className="h-3 w-3 mr-1" /> Jump
                          </button>
                        )}
                      </p>
                    </div>
                    <span
                      className="text-xs text-muted-foreground flex-shrink-0"
                      title={new Date(comment.created_at).toString()}
                    >
                      {new Date(comment.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  {/* Use pre-wrap to preserve line breaks in comments */}
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Client Action Buttons Card - Hide if decision made */}
      {!isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Decision</CardTitle>
            <CardDescription>
              Once you have finished reviewing and adding feedback, please
              submit your decision for Round {track.roundNumber}.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            {/* Request Revisions Button */}
            <RevButtons
              variant="destructive" // Keep as destructive to indicate needing changes
              className="flex-1"
              onClick={handleRequestRevisions}
              disabled={isPending || isDecisionMade}
              aria-label="Request revisions for this round"
            >
              {isPending && track.clientDecision === "pending" ? ( // Show loader only if this action is pending
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Request Revisions (New Round)
            </RevButtons>

            {/* Approve Project Button */}
            <RevButtons
              variant="success"
              className="flex-1"
              onClick={handleApprove}
              disabled={isPending || isDecisionMade}
              aria-label="Approve the final project"
            >
              {isPending && track.clientDecision === "pending" ? ( // Show loader only if this action is pending
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Final Project
            </RevButtons>
          </CardFooter>
          <CardContent className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Approving the project marks it as complete. Requesting revisions
              will start a new round based on the feedback provided above.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}