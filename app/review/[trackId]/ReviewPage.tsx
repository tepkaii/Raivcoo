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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  Check,
  Edit,
  ThumbsUp,
  ShieldAlert,
  Info,
  Clock,
  Image as ImageIconLucide,
  XCircle,
  Building,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { formatTime } from "../lib/utils";
import { MediaContainer } from "./components/MediaContainer";
import { CommentsSection } from "./components/CommentsSection";
import { Badge } from "@/components/ui/badge";

// --- Interfaces ---
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

interface ClientInfo {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface ReviewPageProps {
  clientDisplayName: string | null;
  clientInfo?: ClientInfo;
  track: {
    id: string;
    projectId: string;
    roundNumber: number;
    clientDecision: "pending" | "approved" | "revisions_requested";
  };
  project: { id: string; title: string };
  deliverableLink: string;
  deliverableMediaType?: "video" | "image" | null;
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
function detectAndExtractLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  const links: { url: string; text: string }[] = [];
  let processedText = text;
  const urlMatches = Array.from(text.matchAll(urlRegex));

  urlMatches.forEach((match) => {
    const url = match[0];
    if (text.substring(match.index! - 6, match.index!) === "[LINK:") return;
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
  clientInfo,
  track,
  project,
  deliverableLink,
  deliverableMediaType,
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
  const [commentText, setCommentText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState<string>("");
  const [editingExistingImageUrls, setEditingExistingImageUrls] = useState<
    string[]
  >([]);
  const [editingNewImageFiles, setEditingNewImageFiles] = useState<File[]>([]);
  const [editingNewImagePreviews, setEditingNewImagePreviews] = useState<
    string[]
  >([]);

  // Dialog control
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDecisionMade = track.clientDecision !== "pending";
  const isAnyActionPending =
    isAddPending || isDecisionPending || isEditDeletePending;

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState(formatTime(currentTime));

  useEffect(() => {
    setEditTimeValue(formatTime(currentTime));
  }, [currentTime]);

  const handleTimeUpdate = () => {
    // Parse the timestamp
    const [minutes, seconds] = editTimeValue.split(":").map(Number);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const newTime = minutes * 60 + seconds;
      setCurrentTime(newTime);
      setIsEditingTime(false);
    }
  };

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

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

  const handleEditComment = useCallback(
    (commentId: string) => {
      if (isDecisionMade || isAnyActionPending) return;
      const commentToEdit = comments.find((c) => c.id === commentId);
      if (commentToEdit) {
        const plainText = commentToEdit.comment.text || "";
        const links = commentToEdit.comment.links || [];

        let displayText = plainText;
        links.forEach((link, index) => {
          displayText = displayText.replace(`[LINK:${index}]`, link.url);
        });

        setEditedCommentText(displayText);
        setEditingExistingImageUrls(commentToEdit.comment.images || []);
        setEditingNewImageFiles([]);
        setEditingNewImagePreviews([]);
        setEditingCommentId(commentId);
        setCommentText("");
        setImageFiles([]);
      }
    },
    [comments, isDecisionMade, isAnyActionPending]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditedCommentText("");
    setEditingExistingImageUrls([]);
    setEditingNewImageFiles([]);
    setEditingNewImagePreviews([]);
  }, []);

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
            description: `You can add ${
              availableSlots > 0 ? `${availableSlots} more` : "no more"
            }. Max ${MAX_IMAGES_PER_COMMENT}.`,
            variant: "warning",
          });
          files.splice(availableSlots);
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
          return true;
        });

        setEditingNewImageFiles((prev) => [...prev, ...validFiles]);
        if (event.target) event.target.value = "";
      }
    },
    [editingExistingImageUrls, editingNewImageFiles]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingCommentId || isAnyActionPending || isDecisionMade) return;
    const totalImages =
      editingExistingImageUrls.length + editingNewImageFiles.length;
    if (!editedCommentText.trim() && totalImages === 0) {
      toast({
        title: "Cannot Save Empty Comment",
        description: "Please add text or an image.",
        variant: "warning",
      });
      return;
    }

    const formData = new FormData();
    formData.append("commentId", editingCommentId);
    formData.append("newCommentText", editedCommentText);
    formData.append("existingImages", JSON.stringify(editingExistingImageUrls));
    editingNewImageFiles.forEach((file) => {
      formData.append("newImages", file);
    });

    startEditDeleteTransition(async () => {
      try {
        const result = await updateCommentAction(formData);
        setComments((prev) =>
          prev.map((c) => (c.id === editingCommentId ? result.comment : c))
        );
        handleCancelEdit();
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
  ]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (isAnyActionPending || isDecisionMade) return;

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
    setApproveDialogOpen(false);

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
    approveProjectAction,
    isAnyActionPending,
    isDecisionMade,
    router,
    editingCommentId,
  ]);

  const handleRequestRevisions = useCallback(() => {
    if (isAnyActionPending || isDecisionMade || editingCommentId) return;
    setRevisionDialogOpen(false);

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
    requestRevisionsAction,
    isAnyActionPending,
    isDecisionMade,
    router,
    editingCommentId,
  ]);

  const canInteractWithAddForm =
    !isAnyActionPending && !isDecisionMade && !editingCommentId;

  const isVideoPlayerNeededByType = deliverableMediaType === "video";

  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
      <Card className="border-2 border-dashed">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-y-2">
            <div>
              <CardTitle className="text-xl md:text-2xl font-semibold">
                Review: {project.title}
              </CardTitle>
              <p className="text-muted-foreground text-sm font-medium">
                Round / Version {track.roundNumber}
              </p>
            </div>
            <Badge
              variant={
                track.clientDecision === "approved"
                  ? "success"
                  : track.clientDecision === "revisions_requested"
                    ? "destructive"
                    : "warning"
              }
            >
              {track.clientDecision === "approved"
                ? "Approved"
                : track.clientDecision === "revisions_requested"
                  ? "Revisions Requested"
                  : "Awaiting Feedback"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Media Container replaces all the previous media handling logic */}
          <MediaContainer
            deliverableLink={deliverableLink}
            deliverableMediaType={deliverableMediaType}
            projectTitle={project.title}
            roundNumber={track.roundNumber}
            setCurrentTime={setCurrentTime}
          />

          {isDecisionMade && (
            <div
              className={`p-4 border-2 border-dashed rounded-md ${
                track.clientDecision === "approved"
                  ? "bg-[#064E3B]/40 hover:bg-[#064E3B]/60 text-green-500 "
                  : "bg-[#7F1D1D]/40 text-red-500 hover:bg-[#7F1D1D]/60"
              }`}
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
                  ? "You have approved this round. No further action is needed on this review page."
                  : "The editor has been notified about your revision request."}
              </p>
            </div>
          )}

          {!isDecisionMade && !editingCommentId && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="whitespace-nowrap">Add feedback at: </span>

                {isVideoPlayerNeededByType ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div
                        className="px-2 py-1 bg-secondary border rounded text-xs font-mono cursor-pointer hover:bg-secondary/80"
                        onClick={() => setIsEditingTime(true)}
                        title="Click to edit timestamp"
                      >
                        {formatTime(currentTime)}
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-secondary text-xs"
                          onClick={() =>
                            setCurrentTime(Math.max(0, currentTime - 5))
                          }
                          title="Back 5 seconds"
                        >
                          -5s
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-secondary text-xs"
                          onClick={() => setCurrentTime(currentTime + 5)}
                          title="Forward 5 seconds"
                        >
                          +5s
                        </button>
                      </div>
                    </div>

                    {isEditingTime && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editTimeValue}
                          onChange={(e) => setEditTimeValue(e.target.value)}
                          placeholder="MM:SS"
                          className="w-20 px-2 py-1 text-xs border rounded"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleTimeUpdate();
                            } else if (e.key === "Escape") {
                              setIsEditingTime(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onClick={handleTimeUpdate}
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs border rounded hover:bg-muted"
                          onClick={() => setIsEditingTime(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
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
                  className={`text-sm font-medium flex items-center gap-2 cursor-pointer ${
                    !canInteractWithAddForm ||
                    imageFiles.length >= MAX_IMAGES_PER_COMMENT
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <ImageIconLucide className="h-4 w-4" /> Add Images (
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

      {/* Only show comments section when there are comments or when editing */}
      {(comments.length > 0 || editingCommentId) && (
        <CommentsSection
          comments={comments}
          isVideoFile={isVideoPlayerNeededByType}
          isAudioFile={false}
          isDecisionMade={isDecisionMade}
          editingCommentId={editingCommentId}
          editedCommentText={editedCommentText}
          onEdit={handleEditComment}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDeleteComment}
          onTextChange={setEditedCommentText}
          isEditDeletePending={isEditDeletePending}
          existingImageUrls={editingExistingImageUrls}
          newImageFiles={editingNewImageFiles}
          newImagePreviews={editingNewImagePreviews}
          onRemoveExistingImage={handleRemoveExistingImage}
          onRemoveNewImage={handleRemoveNewImage}
          onFileChange={handleEditFileChange}
          maxImages={MAX_IMAGES_PER_COMMENT}
          acceptedImageTypes={ACCEPTED_IMAGE_TYPES_STRING}
        />
      )}

      {!isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Decision</CardTitle>
            <CardDescription>
              Once you submit your decision for Round {track.roundNumber}, you
              cannot add or edit feedback on this page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col w-full sm:flex-row gap-4">
            {/* Revision Request Dialog */}
            <Dialog
              open={revisionDialogOpen}
              onOpenChange={setRevisionDialogOpen}
            >
              <DialogTrigger asChild>
                <RevButtons
                  variant="destructive"
                  className="flex-1 w-full"
                  disabled={isAnyActionPending || !!editingCommentId}
                >
                  {isDecisionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  Request Revisions
                </RevButtons>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Revisions</DialogTitle>
                  <DialogDescription>
                    {comments.length === 0
                      ? "You haven't added any feedback. Are you sure you want to request revisions without specific comments?"
                      : `Request revisions based on your ${comments.length} comment(s)?`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <RevButtons
                    variant="outline"
                    onClick={() => setRevisionDialogOpen(false)}
                  >
                    Cancel
                  </RevButtons>
                  <RevButtons
                    variant="destructive"
                    onClick={handleRequestRevisions}
                    disabled={isDecisionPending}
                  >
                    {isDecisionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Confirm Revision Request
                  </RevButtons>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Approval Dialog */}
            <Dialog
              open={approveDialogOpen}
              onOpenChange={setApproveDialogOpen}
            >
              <DialogTrigger asChild>
                <RevButtons
                  variant="success"
                  className="flex-1 w-full"
                  disabled={isAnyActionPending || !!editingCommentId}
                >
                  {isDecisionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve Project
                </RevButtons>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to approve "{project.title}" Round{" "}
                    {track.roundNumber}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <RevButtons
                    variant="outline"
                    onClick={() => setApproveDialogOpen(false)}
                  >
                    Cancel
                  </RevButtons>
                  <RevButtons
                    variant="success"
                    onClick={handleApprove}
                    disabled={isDecisionPending}
                  >
                    {isDecisionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Confirm Approval
                  </RevButtons>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
          <CardContent className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Approving marks the project complete. Requesting revisions starts
              a new round with your feedback.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
