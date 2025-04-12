// app/projects/StepCommentsSection.tsx
"use client";

import { formatTime } from "@/app/review/lib/utils";
import { EditableComment } from "./EditableComment";
import Image from "next/image";
import Link from "next/link";
import { Step } from "./TrackManager";

interface StepCommentsSectionProps {
  step: Step;
  isFinalStep: boolean;
  editable?: boolean;
  onSave?: (newText: string, newLinks: { url: string; text: string }[]) => void;
}

export function StepCommentsSection({
  step,
  isFinalStep,
  editable = false,
  onSave,
}: StepCommentsSectionProps) {
  if (!step.metadata || step.metadata.type !== "comment") return null;

  const commentData = {
    id: step.metadata.comment_id || "no-id",
    created_at: step.metadata.created_at || new Date().toISOString(),
    comment: {
      text: step.metadata.text || "",
      timestamp: step.metadata.timestamp || 0,
      images: step.metadata.images || [],
      links: step.metadata.links || [],
    },
    commenter_display_name: "Client",
  };

  const handleSave = async (
    text: string,
    links: { url: string; text: string }[]
  ) => {
    if (onSave) {
      await onSave(text, links);
    }
  };

  return (
    <div className="pl-7 text-sm space-y-2">
      <div className="p-2 border rounded bg-muted/20">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {commentData.commenter_display_name} at{" "}
            {formatTime(commentData.comment.timestamp)}
          </span>
          {isFinalStep &&
            commentData.comment.links &&
            commentData.comment.links.length > 0 && (
              <Link
                href={commentData.comment.links[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Link
              </Link>
            )}
        </div>

        <EditableComment
          initialText={commentData.comment.text}
          initialLinks={commentData.comment.links}
          initialImages={commentData.comment.images}
          onSave={handleSave}
          editable={editable}
        />

        {commentData.comment.images &&
          commentData.comment.images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {commentData.comment.images.map((imageUrl, idx) => (
                <Link
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
                </Link>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
