// app/review/[trackId]/components/CommentsSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import { formatTime } from "@/app/review/lib/utils"; // Adjust path if needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock } from "lucide-react";
import { CommentTextWithLinks } from "./CommentTextWithLinks";
import { EditableReviewComment } from "./EditableReviewComment"; // Import the edit component
import { RevButtons } from "@/components/ui/RevButtons";

// Interface for a single comment
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

// Interface for the props received by this component
interface CommentsSectionProps {
  comments: Comment[];
  isVideoFile: boolean;
  isAudioFile: boolean;
  isDecisionMade: boolean;

  // Edit State & Handlers (Text)
  editingCommentId: string | null;
  editedCommentText: string;
  onEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onDelete: (commentId: string) => void;
  onTextChange: (newText: string) => void;
  isEditDeletePending: boolean;

  // **NEW**: Edit State & Handlers (Images) - Passed down from ReviewPage
  existingImageUrls: string[];
  newImageFiles: File[];
  newImagePreviews: string[];
  onRemoveExistingImage: (index: number) => void;
  onRemoveNewImage: (index: number) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxImages: number;
  acceptedImageTypes: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  isVideoFile,
  isAudioFile,
  isDecisionMade,
  // Text Edit Props
  editingCommentId,
  editedCommentText,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onTextChange,
  isEditDeletePending,
  // **NEW**: Image Edit Props
  existingImageUrls,
  newImageFiles,
  newImagePreviews,
  onRemoveExistingImage,
  onRemoveNewImage,
  onFileChange,
  maxImages,
  acceptedImageTypes,
}) => {
  const isEditingThisComment = (commentId: string) =>
    editingCommentId === commentId;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Feedback Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No feedback comments yet.
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3 -mr-3">
            {comments.map((comment) => {
              const canModify = comment.isOwnComment && !isDecisionMade;
              const isCurrentlyEditing = isEditingThisComment(comment.id);

              return (
                <div
                  key={comment.id}
                  className={`p-3 rounded-md border-2 border-dashed transition-colors duration-200 `}
                >
                  {/* Comment Header: Info and Edit/Delete Buttons */}
                  <div className="flex justify-between items-start gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">
                        {comment.commenter_display_name}
                      </p>
                      {(isVideoFile || isAudioFile) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {formatTime(comment.comment.timestamp)}
                        </p>
                      )}
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
                    {canModify && !isCurrentlyEditing && (
                      <div className="flex items-center gap-1">
                        <RevButtons
                          variant="info"
                          size="icon"
                          className="size-8"
                          onClick={() => onEdit(comment.id)}
                          title="Edit comment"
                          disabled={isEditDeletePending || !!editingCommentId}
                        >
                          <Pencil className="h-4 w-4" />
                        </RevButtons>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8"
                          onClick={() => onDelete(comment.id)}
                          title="Delete comment"
                          disabled={isEditDeletePending || !!editingCommentId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Comment Body: Editable or Display */}
                  {isCurrentlyEditing ? (
                    <EditableReviewComment
                      // Text Props
                      editedText={editedCommentText}
                      onTextChange={onTextChange}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      isSaving={isEditDeletePending}
                      // **NEW**: Image Props Passed Down
                      existingImageUrls={existingImageUrls}
                      newImageFiles={newImageFiles}
                      newImagePreviews={newImagePreviews}
                      onRemoveExistingImage={onRemoveExistingImage}
                      onRemoveNewImage={onRemoveNewImage}
                      onFileChange={onFileChange}
                      maxImages={maxImages}
                      acceptedImageTypes={acceptedImageTypes}
                    />
                  ) : (
                    <>
                      {/* Display Text */}
                      {(comment.comment.text ||
                        (comment.comment.links &&
                          comment.comment.links.length > 0)) && (
                        <div className="mt-1 text-sm">
                          <CommentTextWithLinks
                            text={comment.comment.text}
                            links={comment.comment.links}
                          />
                        </div>
                      )}
                      {/* Display Images */}
                      {comment.comment.images &&
                        comment.comment.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {comment.comment.images.map((imageUrl, idx) => (
                              <a
                                key={idx}
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors"
                              >
                                <Image
                                  src={imageUrl}
                                  alt={`Comment image ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}
                      {/* Display if comment is truly empty */}
                      {!comment.comment.text &&
                        (!comment.comment.images ||
                          comment.comment.images.length === 0) &&
                        (!comment.comment.links ||
                          comment.comment.links.length === 0) && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            (Comment is empty)
                          </p>
                        )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
