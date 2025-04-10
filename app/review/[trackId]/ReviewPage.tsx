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
import { useRouter } from "next/navigation";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { CommentsSection } from "./components/CommentsSection";

import {
  formatTime,
  getVimeoEmbedUrl,
  getYouTubeEmbedUrl,
  isAudioFile,
  isGoogleDriveLink,
  isVideoFile,
  isVimeoLink,
  isYoutubeLink,
  getGoogleDriveEmbedUrl,
  isDropboxLink,
  getDropboxDirectUrl,
} from "../lib/utils";
import { GoogleDrivePlayer } from "./components/GoogleDrivePlayer";
import { VimeoPlayer } from "./components/VimeoPlayer";

interface Comment {
  id: string;
  timestamp: number;
  comment: string;
  created_at: string;
  commenter_display_name: string;
  isOwnComment?: boolean;
}

interface ReviewPageProps {
  currentUserEmail: string;
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
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isDecisionMade = track.clientDecision !== "pending";

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(console.error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || isPending || isDecisionMade) return;

    startTransition(async () => {
      try {
        await addCommentAction(track.id, currentTime, commentText);
        toast({
          title: "Success",
          description: "Comment added successfully!",
          variant: "success",
        });
        setCommentText("");
        router.refresh();
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
    if (
      !confirm(
        `Are you sure you want to approve the entire project "${project.title}"?`
      )
    )
      return;

    startTransition(async () => {
      try {
        await approveProjectAction(project.id, track.id);
        toast({
          title: "Project Approved!",
          description: "Thank you! The editor has been notified.",
          variant: "success",
        });
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

    if (
      comments.length === 0 &&
      !confirm("You haven't left any feedback comments. Are you sure?")
    )
      return;
    else if (!confirm(`Request revisions for Round ${track.roundNumber}?`))
      return;

    startTransition(async () => {
      try {
        await requestRevisionsAction(track.id);
        toast({
          title: "Revisions Requested",
          description: `Round ${track.roundNumber + 1} has been initiated.`,
          variant: "success",
        });
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

  const googleDriveEmbedUrl = isGoogleDriveLink(deliverableLink)
    ? getGoogleDriveEmbedUrl(deliverableLink)
    : null;
  // Media type detection
  const youtubeEmbedUrl = isYoutubeLink(deliverableLink)
    ? getYouTubeEmbedUrl(deliverableLink)
    : null;
  const vimeoEmbedUrl = isVimeoLink(deliverableLink)
    ? getVimeoEmbedUrl(deliverableLink)
    : null;
  const isVideo = isVideoFile(deliverableLink);
  const isAudio = isAudioFile(deliverableLink);
  const dropboxDirectUrl = isDropboxLink(deliverableLink)
    ? getDropboxDirectUrl(deliverableLink)
    : null;

  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
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

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="rounded-lg overflow-hidden border bg-black">
            {youtubeEmbedUrl ? (
              <YouTubePlayer
                youtubeEmbedUrl={youtubeEmbedUrl}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
              />
            ) : dropboxDirectUrl ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full aspect-video block"
                  controls
                  preload="metadata"
                  onTimeUpdate={() =>
                    videoRef.current &&
                    setCurrentTime(videoRef.current.currentTime)
                  }
                  onError={(e) => {
                    console.error("Dropbox video error:", e);
                    toast({
                      title: "Playback Error",
                      description: "Could not load the Dropbox video.",
                      variant: "destructive",
                    });
                  }}
                >
                  <source src={dropboxDirectUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </>
            ) : googleDriveEmbedUrl ? (
              <GoogleDrivePlayer
                googleDriveEmbedUrl={googleDriveEmbedUrl}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
              />
            ) : vimeoEmbedUrl ? (
              <VimeoPlayer
                vimeoEmbedUrl={vimeoEmbedUrl}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
              />
            ) : isVideo ? (
              <video
                ref={videoRef}
                className="w-full aspect-video block"
                controls
                onTimeUpdate={() =>
                  videoRef.current &&
                  setCurrentTime(videoRef.current.currentTime)
                }
                src={deliverableLink}
              />
            ) : isAudio ? (
              <div className="p-4 bg-gray-800">
                <audio
                  ref={videoRef as any}
                  className="w-full"
                  controls
                  onTimeUpdate={() =>
                    videoRef.current &&
                    setCurrentTime(videoRef.current.currentTime)
                  }
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
                />
                <RevButtons
                  type="submit"
                  variant="default"
                  size="lg"
                  disabled={isPending || !commentText.trim() || isDecisionMade}
                >
                  {isPending && !track.clientDecision ? (
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

      <CommentsSection
        comments={comments}
        isVideoFile={isVideo}
        isAudioFile={isAudio}
        jumpToTime={jumpToTime}
      />

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
            <RevButtons
              variant="destructive"
              className="flex-1"
              onClick={handleRequestRevisions}
              disabled={isPending || isDecisionMade}
            >
              {isPending && track.clientDecision === "pending" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Request Revisions (New Round)
            </RevButtons>

            <RevButtons
              variant="success"
              className="flex-1"
              onClick={handleApprove}
              disabled={isPending || isDecisionMade}
            >
              {isPending && track.clientDecision === "pending" ? (
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
