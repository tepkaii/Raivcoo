"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Loader2,
  Plus,
  X,
  Image as ImageIcon,
  XCircle,
  GripVertical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createInitialRound } from "../../actions";
import { Input } from "@/components/ui/input";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const MAX_IMAGES_PER_COMMENT = 4;
const ACCEPTED_IMAGE_TYPES_STRING = "image/jpeg,image/png,image/webp";

export function InitialDeliveryForm({
  id,
  trackId,
}: {
  id: string;
  trackId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<
    {
      text: string;
      images?: File[];
      links?: { url: string; text: string }[];
    }[]
  >([{ text: "" }]);
  const router = useRouter();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSubmit = () => {
    const validComments = comments.filter(
      (c) => c.text.trim() !== "" || (c.images && c.images.length > 0)
    );
    if (validComments.length === 0) {
      toast({
        title: "Error",
        description: "At least one comment with text or image is required",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        await createInitialRound(id, trackId, validComments);
        toast({
          title: "Initial Round Created",
          description: "You can now work on completing each step",
          variant: "success",
        });
        router.push(`/dashboard/projects/${id}/edit/${trackId}`);
      } catch (error) {
        console.error("Creation error:", error);
        toast({
          title: "Creation Failed",
          description:
            error instanceof Error ? error.message : "Could not create round",
          variant: "destructive",
        });
      }
    });
  };

  const addComment = () => {
    setComments([...comments, { text: "" }]);
  };

  const removeComment = (index: number) => {
    if (comments.length <= 1) return;
    setComments(comments.filter((_, i) => i !== index));
  };

  const updateComment = (index: number, text: string) => {
    const newComments = [...comments];
    newComments[index].text = text;
    setComments(newComments);
  };

  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const totalFiles = (comments[index].images?.length || 0) + files.length;

      if (totalFiles > MAX_IMAGES_PER_COMMENT) {
        toast({
          title: "Too many images",
          description: `You can only select up to ${MAX_IMAGES_PER_COMMENT} images per comment.`,
          variant: "warning",
        });
        return;
      }

      const newComments = [...comments];
      newComments[index].images = [
        ...(newComments[index].images || []),
        ...files,
      ];
      setComments(newComments);
    }
  };

  const removeImage = (commentIndex: number, imageIndex: number) => {
    const newComments = [...comments];
    newComments[commentIndex].images = newComments[commentIndex].images?.filter(
      (_, i) => i !== imageIndex
    );
    setComments(newComments);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(comments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setComments(items);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-4">
        <Label>Create Work Steps</Label>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="comments">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-6"
              >
                {comments.map((comment, index) => (
                  <Draggable
                    key={index}
                    draggableId={`comment-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative"
                      >
                        {/* Number badge positioned outside the card */}
                        <div className="absolute left-4 top-4 flex items-center gap-1.5">
                          <div
                            {...provided.dragHandleProps}
                            className="p-1 rounded hover:bg-accent cursor-grab"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Card content */}
                        <div className="border rounded-lg p-4 space-y-3 bg-card pl-12">
                          {" "}
                          {/* Added left padding */}
                          <div className="flex justify-between items-start gap-2">
                            <Textarea
                              value={comment.text}
                              onChange={(e) =>
                                updateComment(index, e.target.value)
                              }
                              placeholder="Describe this work step..."
                              className="flex-1 min-h-[80px]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeComment(index)}
                              disabled={comments.length <= 1}
                              className="ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="text-sm font-medium text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-primary"
                            >
                              <ImageIcon className="h-4 w-4" /> Add Reference
                              Images (Optional)
                            </label>
                            <Input
                              id={`image-upload-${index}`}
                              ref={(el) => (fileInputRefs.current[index] = el)}
                              type="file"
                              multiple
                              accept={ACCEPTED_IMAGE_TYPES_STRING}
                              onChange={(e) => handleFileChange(index, e)}
                              className="hidden"
                              disabled={
                                (comment.images?.length || 0) >=
                                MAX_IMAGES_PER_COMMENT
                              }
                            />

                            {comment.images && comment.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {comment.images.map((file, imgIndex) => (
                                  <div
                                    key={imgIndex}
                                    className="relative w-20 h-20"
                                  >
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Preview ${imgIndex + 1}`}
                                      className="w-full h-full object-cover rounded border"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-0 right-0 h-5 w-5 rounded-full -mt-1 -mr-1"
                                      onClick={() =>
                                        removeImage(index, imgIndex)
                                      }
                                      title="Remove image"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          type="button"
          variant="outline"
          onClick={addComment}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Work Step
        </Button>
      </div>

      <RevButtons
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Work Steps...
          </>
        ) : (
          "Create Initial Work Steps"
        )}
      </RevButtons>
    </div>
  );
}
