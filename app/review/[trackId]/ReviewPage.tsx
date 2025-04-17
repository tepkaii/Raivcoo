// app/review/[trackId]/ReviewPage.tsx
"use client";

import React, {
  useState,
  useRef,
  useTransition,
  useEffect,
  useCallback,
} from "react";
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
import { GoogleDrivePlayer } from "./components/GoogleDrivePlayer";
import { VimeoPlayer } from "./components/VimeoPlayer";
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
} from "../lib/utils"; // Ensure path is correct

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
  project: { id: string; title: string };
  deliverableLink: string;
  initialComments: Comment[];
  addCommentAction: (
    formData: FormData
  ) => Promise<{ message: string; comment: Comment }>;
  approveProjectAction: (projectId: string, trackId: string) => Promise<any>;
  requestRevisionsAction: (trackId: string) => Promise<any>;
  updateCommentAction: (
    formData: FormData
  ) => Promise<{ message: string; comment: Comment }>;
  deleteCommentAction: (commentId: string) => Promise<{ message: string }>;
}

// --- Helpers ---
function renderPlainTextWithUrls(
  rawText: string | undefined,
  links: { url: string; text: string }[] | undefined
): string {
  if (!rawText) return "";
  if (!links || links.length === 0) return rawText;
  let renderedText = rawText;
  renderedText = renderedText.replace(/\[LINK:(\d+)\]/g, (match, indexStr) => {
    const index = parseInt(indexStr, 10);
    return links[index]?.url || match;
  });
  return renderedText;
}
function detectAndExtractLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  const links: { url: string; text: string }[] = [];
  let processedText = text;
  const urlMatches = Array.from(text.matchAll(urlRegex));
  urlMatches.forEach((match) => {
    const url = match[0];
    if (text.substring(match.index - 6, match.index) === "[LINK:") return;
    let existingLinkIndex = links.findIndex((link) => link.url === url);
    if (existingLinkIndex === -1) {
      links.push({ url: url, text: url });
      existingLinkIndex = links.length - 1;
    }
    processedText = processedText.replace(url, `[LINK:${existingLinkIndex}]`);
  });
  return { processedText, links };
}

// --- Constants ---
const MAX_IMAGES_PER_COMMENT = 4;
const ACCEPTED_IMAGE_TYPES_STRING = "image/jpeg,image/png,image/webp";

// --- Component ---
export default function ReviewPage({
  clientDisplayName,
  track,
  project,
  deliverableLink,
  initialComments,
  addCommentAction,
  approveProjectAction,
  requestRevisionsAction,
  updateCommentAction,
  deleteCommentAction,
}: ReviewPageProps) {
  const router = useRouter();
  const [isAddPending, startAddTransition] = useTransition();
  const [isDecisionPending, startDecisionTransition] = useTransition();
  const [isEditDeletePending, startEditDeleteTransition] = useTransition();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState(""); // New comment text
  const [currentTime, setCurrentTime] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // New comment images
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // New comment previews

  // State for Editing Comments
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState<string>("");
  const [editingExistingImageUrls, setEditingExistingImageUrls] = useState<
    string[]
  >([]); // Existing images for the comment being edited
  const [editingNewImageFiles, setEditingNewImageFiles] = useState<File[]>([]); // New files added *during* edit
  const [editingNewImagePreviews, setEditingNewImagePreviews] = useState<
    string[]
  >([]); // Previews for new files added during edit

  const videoRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // For new comment input

  const isDecisionMade = track.clientDecision !== "pending";
  const isAnyActionPending =
    isAddPending || isDecisionPending || isEditDeletePending;

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);
  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach(URL.revokeObjectURL);
  }, [imageFiles]);
  // Effect for generating/revoking previews for *editing* images
  useEffect(() => {
    const previews = editingNewImageFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setEditingNewImagePreviews(previews);
    return () => previews.forEach(URL.revokeObjectURL);
  }, [editingNewImageFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const currentTotal = imageFiles.length + files.length;
      if (currentTotal > MAX_IMAGES_PER_COMMENT) {
        toast({
          title: "Too many images",
          description: `Max ${MAX_IMAGES_PER_COMMENT} total.`,
          variant: "warning",
        });
        files.splice(MAX_IMAGES_PER_COMMENT - imageFiles.length);
      }
      const validFiles = files.filter((file) =>
        ACCEPTED_IMAGE_TYPES_STRING.includes(file.type)
      );
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid File Type",
          description: "Some files ignored.",
          variant: "warning",
        });
      }
      setImageFiles((prev) => [...prev, ...validFiles]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const removeImage = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmitComment = useCallback(async () => {
    if (editingCommentId || isAnyActionPending || isDecisionMade) return;
    if (!commentText.trim() && imageFiles.length === 0) {
      toast({ title: "Empty Comment", variant: "warning" });
      return;
    }
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
    startAddTransition(async () => {
      try {
        const result = await addCommentAction(formData);
        setComments((prev) => [...prev, result.comment]);
        setCommentText("");
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast({ title: "Success", variant: "success" });
      } catch (error: any) {
        toast({
          title: "Error Adding",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [
    commentText,
    imageFiles,
    track.id,
    currentTime,
    addCommentAction,
    isAnyActionPending,
    isDecisionMade,
    editingCommentId,
  ]);

  // --- Edit/Delete Handlers ---
  const handleEditComment = useCallback(
    (commentId: string) => {
      if (isDecisionMade || isAnyActionPending) return;
      const commentToEdit = comments.find((c) => c.id === commentId);
      if (commentToEdit) {
        setEditedCommentText(
          renderPlainTextWithUrls(
            commentToEdit.comment.text,
            commentToEdit.comment.links
          )
        );
        setEditingExistingImageUrls(commentToEdit.comment.images || []); // <<<<<<<<<<<<<<< Populate existing images
        setEditingNewImageFiles([]); // <<<<<<<<<<<<<<< Reset new files for this edit session
        setEditingNewImagePreviews([]); // <<<<<<<<<<<<<<< Reset previews
        setEditingCommentId(commentId);
        setCommentText("");
        setImageFiles([]); // Clear new comment form
      }
    },
    [comments, isDecisionMade, isAnyActionPending]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditedCommentText("");
    setEditingExistingImageUrls([]);
    setEditingNewImageFiles([]);
    setEditingNewImagePreviews([]); // <<<< Reset image edit state
  }, []);

  // Handlers for managing images *during* edit
  const handleRemoveExistingImage = useCallback((indexToRemove: number) => {
    setEditingExistingImageUrls((prev) =>
      prev.filter((_, i) => i !== indexToRemove)
    );
  }, []);
  const handleRemoveNewImage = useCallback((indexToRemove: number) => {
    setEditingNewImageFiles((prev) =>
      prev.filter((_, i) => i !== indexToRemove)
    );
  }, []);
  const handleEditFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        const files = Array.from(event.target.files);
        const currentTotal =
          editingExistingImageUrls.length +
          editingNewImageFiles.length +
          files.length;
        const availableSlots =
          MAX_IMAGES_PER_COMMENT -
          (editingExistingImageUrls.length + editingNewImageFiles.length);

        if (currentTotal > MAX_IMAGES_PER_COMMENT) {
          toast({
            title: "Too many images",
            description: `You can add ${availableSlots > 0 ? `${availableSlots} more` : "no more"}. Max ${MAX_IMAGES_PER_COMMENT}.`,
            variant: "warning",
          });
          files.splice(availableSlots); // Keep only allowed number
        }
        const validFiles = files.filter((file) => {
          if (!ACCEPTED_IMAGE_TYPES_STRING.includes(file.type)) {
            toast({
              title: "Invalid File Type",
              description: `"${file.name}" ignored.`,
              variant: "warning",
            });
            return false;
          }
          // Add size validation if needed
          return true;
        });

        setEditingNewImageFiles((prev) => [...prev, ...validFiles]);
        // Reset the file input visually after selection
        if (event.target) event.target.value = "";
      }
    },
    [editingExistingImageUrls, editingNewImageFiles]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingCommentId || isAnyActionPending || isDecisionMade) return;
    const totalImages =
      editingExistingImageUrls.length + editingNewImageFiles.length;
    // Prevent saving if BOTH text is empty AND there are no images
    if (!editedCommentText.trim() && totalImages === 0) {
      toast({
        title: "Cannot Save Empty Comment",
        description: "Please add text or an image.",
        variant: "warning",
      });
      return;
    }

    // Optional: Check if anything actually changed (more complex with images)
    // const originalComment = comments.find(c => c.id === editingCommentId); ... compare text and image arrays ...

    const formData = new FormData();
    formData.append("commentId", editingCommentId);
    formData.append("newCommentText", editedCommentText); // Send plain text
    formData.append("existingImages", JSON.stringify(editingExistingImageUrls)); // <<<< Send remaining existing image URLs
    editingNewImageFiles.forEach((file) => {
      // <<<< Send new files
      formData.append("newImages", file);
    });

    startEditDeleteTransition(async () => {
      try {
        const result = await updateCommentAction(formData);
        setComments((prev) =>
          prev.map((c) => (c.id === editingCommentId ? result.comment : c))
        );
        handleCancelEdit(); // Reset edit state
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
      } catch (error: any) {
        toast({
          title: "Error Updating Comment",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [
    editingCommentId,
    editedCommentText,
    editingExistingImageUrls,
    editingNewImageFiles,
    updateCommentAction,
    isAnyActionPending,
    isDecisionMade,
    handleCancelEdit,
    comments /* add comments if needed for change detection */,
  ]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (isAnyActionPending || isDecisionMade) return;
      if (!confirm("Delete this comment permanently?")) {
        return;
      }
      startEditDeleteTransition(async () => {
        try {
          const result = await deleteCommentAction(commentId);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          if (editingCommentId === commentId) {
            handleCancelEdit();
          }
          toast({
            title: "Success",
            description: result.message,
            variant: "success",
          });
        } catch (error: any) {
          toast({
            title: "Error Deleting",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    },
    [
      deleteCommentAction,
      isAnyActionPending,
      isDecisionMade,
      editingCommentId,
      handleCancelEdit,
    ]
  );

  const handleApprove = useCallback(() => {
    if (isAnyActionPending || isDecisionMade || editingCommentId) return;
    if (!confirm(`Approve project "${project.title}"?`)) return;
    startDecisionTransition(async () => {
      try {
        await approveProjectAction(project.id, track.id);
        toast({ title: "Project Approved!", variant: "success" });
        router.refresh();
      } catch (error: any) {
        toast({
          title: "Approval Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [
    project.id,
    track.id,
    project.title,
    approveProjectAction,
    isAnyActionPending,
    isDecisionMade,
    router,
    editingCommentId,
  ]);

  const handleRequestRevisions = useCallback(() => {
    if (isAnyActionPending || isDecisionMade || editingCommentId) return;
    if (
      comments.length === 0 &&
      !confirm("No feedback added. Request revisions anyway?")
    )
      return;
    if (
      comments.length > 0 &&
      !confirm(`Request revisions based on ${comments.length} comment(s)?`)
    )
      return;
    startDecisionTransition(async () => {
      try {
        await requestRevisionsAction(track.id);
        toast({ title: "Revisions Requested", variant: "success" });
        router.refresh();
      } catch (error: any) {
        toast({
          title: "Request Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [
    track.id,
    comments.length,
    requestRevisionsAction,
    isAnyActionPending,
    isDecisionMade,
    router,
    editingCommentId,
  ]);

  // --- Media Player Logic ---
  const googleDriveEmbedUrl = isGoogleDriveLink(deliverableLink)
    ? getGoogleDriveEmbedUrl(deliverableLink)
    : null;
  const youtubeEmbedUrl = isYoutubeLink(deliverableLink)
    ? getYouTubeEmbedUrl(deliverableLink)
    : null;
  const vimeoEmbedUrl = isVimeoLink(deliverableLink)
    ? getVimeoEmbedUrl(deliverableLink)
    : null;
  const dropboxDirectUrl = isDropboxLink(deliverableLink)
    ? getDropboxDirectUrl(deliverableLink)
    : null;
  const isVideo = isVideoFile(deliverableLink);
  const isAudio = isAudioFile(deliverableLink);
  const isVideoPlayerNeeded =
    isVideo ||
    !!youtubeEmbedUrl ||
    !!vimeoEmbedUrl ||
    !!googleDriveEmbedUrl ||
    !!dropboxDirectUrl;
  const isAudioPlayerNeeded = isAudio && !isVideoPlayerNeeded;
  const canInteractWithAddForm =
    !isAnyActionPending && !isDecisionMade && !editingCommentId;
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            {project.title} - Round {track.roundNumber} Review
          </CardTitle>
          <CardDescription>
            Deliverable review for {clientDisplayName || "Reviewer"}.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="rounded-lg overflow-hidden border bg-black aspect-video relative">
            {youtubeEmbedUrl ? (
              <YouTubePlayer
                youtubeEmbedUrl={youtubeEmbedUrl}
                setCurrentTime={setCurrentTime}
              />
            ) : googleDriveEmbedUrl ? (
              <GoogleDrivePlayer
                googleDriveEmbedUrl={googleDriveEmbedUrl}
                setCurrentTime={setCurrentTime}
              />
            ) : vimeoEmbedUrl ? (
              <VimeoPlayer
                vimeoEmbedUrl={vimeoEmbedUrl}
                setCurrentTime={setCurrentTime}
              />
            ) : dropboxDirectUrl ? (
              <video
                ref={videoRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-full block"
                controls
                onTimeUpdate={handleTimeUpdate}
              >
                <source src={dropboxDirectUrl} type="video/mp4" />
                Your browser does not support video.
              </video>
            ) : isVideo ? (
              <video
                ref={videoRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-full block"
                controls
                onTimeUpdate={handleTimeUpdate}
                src={deliverableLink}
              >
                Your browser does not support video.
              </video>
            ) : isAudio ? (
              <div className="p-4 bg-gray-800 h-full flex items-center">
                <audio
                  ref={videoRef as React.RefObject<HTMLAudioElement>}
                  className="w-full"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  src={deliverableLink}
                >
                  Your browser does not support audio.
                </audio>
              </div>
            ) : (
              <div className="p-6 bg-secondary flex flex-col items-center text-center justify-center h-full">
                {" "}
                <MessageSquareWarning className="w-10 h-10 text-muted-foreground mb-3" />{" "}
                <p className="font-medium mb-1">Cannot preview.</p>{" "}
                <a
                  href={deliverableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
                >
                  View/Download <ExternalLink className="h-4 w-4" />
                </a>{" "}
              </div>
            )}
          </div>

          {isDecisionMade && (
            <div
              className={`p-4 border-2 border-dashed rounded-md ${track.clientDecision === "approved" ? "bg-green-600 border-green-700 text-primary-foreground" : "bg-red-600 border-red-700 text-primary-foreground"}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {track.clientDecision === "approved" ? (
                  <ThumbsUp className="h-5 w-5" />
                ) : (
                  <ShieldAlert className="h-5 w-5" />
                )}
                {track.clientDecision === "approved"
                  ? "Project Approved"
                  : "Revisions Requested"}
              </div>
              <p className="text-sm opacity-90 mt-1 pl-7">
                {track.clientDecision === "approved"
                  ? "No further action needed."
                  : "The editor has been notified."}
              </p>
            </div>
          )}

          {!isDecisionMade && !editingCommentId && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Add feedback at:{" "}
                {isVideoPlayerNeeded || isAudioPlayerNeeded
                  ? formatTime(currentTime)
                  : "N/A"}
              </div>
              <Textarea
                placeholder="Enter your feedback here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
                rows={3}
                disabled={!canInteractWithAddForm || isAddPending}
                required={imageFiles.length === 0}
              />
              <div className="space-y-2">
                <label
                  htmlFor="image-upload"
                  className={`text-sm font-medium flex items-center gap-2 cursor-pointer ${!canInteractWithAddForm || imageFiles.length >= MAX_IMAGES_PER_COMMENT ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-primary"}`}
                >
                  <ImageIcon className="h-4 w-4" /> Add Images (
                  {imageFiles.length}/{MAX_IMAGES_PER_COMMENT})
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
                    !canInteractWithAddForm ||
                    imageFiles.length >= MAX_IMAGES_PER_COMMENT
                  }
                />
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 group">
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 h-5 w-5 rounded-full -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(i)}
                          title="Remove image"
                          disabled={!canInteractWithAddForm}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
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
                    !canInteractWithAddForm ||
                    isAddPending ||
                    (!commentText.trim() && imageFiles.length === 0)
                  }
                >
                  {isAddPending ? (
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
        isVideoFile={isVideoPlayerNeeded}
        isAudioFile={isAudioPlayerNeeded}
        isDecisionMade={isDecisionMade}
        editingCommentId={editingCommentId}
        editedCommentText={editedCommentText}
        onEdit={handleEditComment}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDeleteComment}
        onTextChange={setEditedCommentText}
        isEditDeletePending={isEditDeletePending}
        // Pass image state/handlers for edit mode
        existingImageUrls={editingExistingImageUrls}
        newImageFiles={editingNewImageFiles}
        newImagePreviews={editingNewImagePreviews}
        onRemoveExistingImage={handleRemoveExistingImage}
        onRemoveNewImage={handleRemoveNewImage}
        onFileChange={handleEditFileChange} // Use the specific handler for edits
        maxImages={MAX_IMAGES_PER_COMMENT}
        acceptedImageTypes={ACCEPTED_IMAGE_TYPES_STRING}
      />

      {!isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Decision</CardTitle>
            <CardDescription>
              Submit your decision for Round {track.roundNumber}.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <RevButtons
              variant="destructive"
              className="flex-1"
              onClick={handleRequestRevisions}
              disabled={isAnyActionPending || !!editingCommentId}
            >
              {isDecisionPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Request Revisions
            </RevButtons>
            <RevButtons
              variant="success"
              className="flex-1"
              onClick={handleApprove}
              disabled={isAnyActionPending || !!editingCommentId}
            >
              {isDecisionPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Project
            </RevButtons>
          </CardFooter>
          <CardContent className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Approving marks the project complete. Requesting revisions starts
              a new round.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
