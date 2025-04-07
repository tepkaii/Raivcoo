// app/projects/[projectId]/review/[trackId]/ReviewPage.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Play } from "lucide-react";

interface ReviewPageProps {
  track: {
    id: string;
    project_id: string;
    round_number: number;
    steps: any[];
  };
  project: {
    title: string;
    client: {
      name: string;
    };
  };
  deliverableLink: string;
  comments: Array<{
    id: string;
    user_id: string;
    timestamp: number;
    comment: string;
    created_at: string;
    user: {
      display_name: string;
    };
  }>;
  createReviewComment: (
    trackId: string,
    timestamp: number,
    comment: string
  ) => Promise<any>;
}

export default function ReviewPage({
  track,
  project,
  deliverableLink,
  comments,
  createReviewComment,
}: ReviewPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createReviewComment(track.id, currentTime, commentText);
      toast({
        title: "Success",
        description: "Comment added successfully",
        variant: "success",
      });
      setCommentText("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const isYoutubeLink =
    deliverableLink.includes("youtube.com") ||
    deliverableLink.includes("youtu.be");
  const isVideoFile = deliverableLink.match(/\.(mp4|webm|ogg)$/i);

  // Extract YouTube ID if it's a YouTube link
  let youtubeEmbedUrl = "";
  if (isYoutubeLink) {
    const urlObj = new URL(deliverableLink);
    const searchParams = new URLSearchParams(urlObj.search);
    const videoId = searchParams.get("v") || urlObj.pathname.split("/").pop();
    if (videoId) {
      youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return (
    <div className="space-y-6 ">
      <Card>
        <CardHeader>
          <CardTitle>
            {project.title} - Round {track.round_number} Review
          </CardTitle>
          <CardDescription>Client: {project.client.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isYoutubeLink && youtubeEmbedUrl ? (
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={youtubeEmbedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : isVideoFile ? (
              <video
                ref={videoRef}
                className="w-full aspect-video"
                controls
                onTimeUpdate={handleTimeUpdate}
                src={deliverableLink}
              />
            ) : (
              <div className="p-4 border rounded-md">
                <p>
                  This deliverable is not a video.{" "}
                  <a
                    href={deliverableLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View the deliverable
                  </a>
                </p>
              </div>
            )}

            <div className="mt-4">
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    Current Time: {formatTime(currentTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add your feedback here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <RevButtons
                    type="submit"
                    variant="success"
                    className="self-end"
                    disabled={isSubmitting || !commentText.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </RevButtons>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to leave feedback!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{comment.user.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        at {formatTime(comment.timestamp)}
                        <button
                          onClick={() => jumpToTime(comment.timestamp)}
                          className="ml-2 inline-flex items-center text-blue-600 hover:underline"
                        >
                          <Play className="h-3 w-3 mr-1" /> Jump to time
                        </button>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
