//  ./ReviewPage.tsx
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Image as ImageIcon,
  XCircle,
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

const MAX_IMAGES_PER_COMMENT = 4;
const ACCEPTED_IMAGE_TYPES_STRING = "image/jpeg,image/png,image/webp";

interface Comment {
  id: string;
  comment: {
    text: string;
    timestamp: number;
    images?: string[];
    links?: { url: string; text: string }[];
  };
  created_at: string;
  commenter_display_name: string;
  isOwnComment?: boolean;
}

interface ReviewPageProps {
  clientDisplayName: string | null;
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
  deliverableLink: string;
  initialComments: Comment[];
  addCommentAction: (
    formData: FormData
  ) => Promise<{ message: string; comment: Comment }>;
  approveProjectAction: (projectId: string, trackId: string) => Promise<any>;
  requestRevisionsAction: (trackId: string) => Promise<any>;
}
export interface CommentsSectionProps {
  comments: Comment[];
  isVideoFile: boolean;
  isAudioFile: boolean;
  jumpToTime: (time: number) => void;
  renderCommentText?: (comment: Comment) => React.ReactNode; // ✅ add this
}
export const CommentTextWithLinks = ({
  text,
  links = [],
}: {
  text: string;
  links?: { url: string; text: string }[];
}) => {
  if (!links || links.length === 0) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  // Create a regex pattern that matches all link placeholders
  const linkPattern = /\[LINK:(\d+)\]/g;
  let lastIndex = 0;
  const parts = [];
  let match;

  // Find all link placeholders and build an array of text and link elements
  while ((match = linkPattern.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Extract link index and add the link element
    const linkIndex = parseInt(match[1], 10);
    if (links[linkIndex]) {
      parts.push(
        <a
          key={`link-${linkIndex}`}
          href={links[linkIndex].url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline break-all"
        >
          {links[linkIndex].text || links[linkIndex].url}
        </a>
      );
    } else {
      // If link doesn't exist, just show the placeholder
      parts.push(<span key={`missing-${linkIndex}`}>{match[0]}</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
  }

  return <p className="whitespace-pre-wrap">{parts}</p>;
};
export default function ReviewPage({
  clientDisplayName,
  track,
  project,
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDecisionMade = track.clientDecision !== "pending";

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const detectAndExtractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links: { url: string; text: string }[] = [];
    let processedText = text;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      links.push({
        url: match[0],
        text: match[0],
      });
      processedText = processedText.replace(
        match[0],
        `[LINK:${links.length - 1}]`
      );
    }

    return { processedText, links };
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current && typeof videoRef.current.currentTime === "number") {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(console.error);
    } else {
      console.warn(
        "Cannot programmatically jump to time for the current player type"
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const totalFiles = imageFiles.length + files.length;

      if (totalFiles > MAX_IMAGES_PER_COMMENT) {
        toast({
          title: "Too many images",
          description: `You can only select up to ${MAX_IMAGES_PER_COMMENT} images in total.`,
          variant: "warning",
        });
        return;
      }
      setImageFiles((prevFiles) => [...prevFiles, ...files]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && imageFiles.length === 0) {
      toast({
        title: "Empty Comment",
        description: "Please enter text or add an image.",
        variant: "warning",
      });
      return;
    }
    if (isPending || isDecisionMade) return;

    const { processedText, links } = detectAndExtractLinks(commentText);

    const formData = new FormData();
    formData.append("trackId", track.id);
    formData.append("timestamp", currentTime.toString());
    formData.append("commentText", processedText.trim());
    if (links.length > 0) {
      formData.append("links", JSON.stringify(links));
    }
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    startTransition(async () => {
      try {
        const result = await addCommentAction(formData);
        toast({
          title: "Success",
          description: result.message || "Comment added successfully!",
          variant: "success",
        });
        setCommentText("");
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setComments((prevComments) => [...prevComments, result.comment]);
      } catch (error: any) {
        console.error("Error submitting comment:", error);
        toast({
          title: "Error Adding Comment",
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

  const canInteractWithCommentForm = !isPending && !isDecisionMade;

  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            {project.title} - Round {track.roundNumber} Review
          </CardTitle>
          <CardDescription>
            Deliverable review for {clientDisplayName || "Reviewer"}. Please
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
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Add feedback at:{" "}
                {formatTime(currentTime)}
              </div>

              <Textarea
                placeholder="Enter your feedback here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
                rows={3}
                disabled={!canInteractWithCommentForm}
                required={imageFiles.length === 0}
              />

              <div className="space-y-2">
                <label
                  htmlFor="image-upload"
                  className="text-sm font-medium text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-primary"
                >
                  <ImageIcon className="h-4 w-4" /> Add Images (Optional, up to{" "}
                  {MAX_IMAGES_PER_COMMENT})
                </label>
                <Input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_IMAGE_TYPES_STRING}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={
                    !canInteractWithCommentForm ||
                    imageFiles.length >= MAX_IMAGES_PER_COMMENT
                  }
                />
                {imageFiles.length >= MAX_IMAGES_PER_COMMENT && (
                  <p className="text-xs text-muted-foreground">
                    Maximum number of images reached.
                  </p>
                )}

                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((previewUrl, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img
                          src={previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded border"
                        />
                        {canInteractWithCommentForm && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-5 w-5 rounded-full -mt-1 -mr-1"
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <RevButtons
                  onClick={handleSubmitComment}
                  variant="default"
                  size="lg"
                  disabled={
                    !canInteractWithCommentForm ||
                    (!commentText.trim() && imageFiles.length === 0)
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Add Comment</span>
                </RevButtons>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CommentsSection
        comments={comments}
        isVideoFile={
          isVideo ||
          !!youtubeEmbedUrl ||
          !!vimeoEmbedUrl ||
          !!googleDriveEmbedUrl ||
          !!dropboxDirectUrl
        }
        isAudioFile={isAudio}
        jumpToTime={jumpToTime}
        renderCommentText={(comment) => (
          <CommentTextWithLinks
            text={comment.comment.text}
            links={
              typeof comment.comment.links === "string"
                ? JSON.parse(comment.comment.links)
                : comment.comment.links
            }
          />
        )}
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
