// app/projects/[projectId]/review/[trackId]/components/CommentsSection.tsx
"use client";

import React from "react";
import { formatTime } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { CommentTextWithLinks } from "../ReviewPage";

interface Comment {
  id: string;
  created_at: string;
  comment: {
    links(links: any): { url: string; text: string }[] | undefined;
    text: string;
    timestamp: number;
    images?: string[];
  };
  commenter_display_name: string;
  isOwnComment?: boolean;
}
interface CommentsSectionProps {
  comments: Comment[];
  isVideoFile: boolean;
  isAudioFile: boolean;
  renderCommentText?: (comment: Comment) => React.ReactNode; // ✅ add this
}
interface CommentsSectionProps {
  comments: Comment[];
  isVideoFile: boolean;
  isAudioFile: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  renderCommentText,
}) => {
  return (
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
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 bg-[#1F1F1F] rounded-md border-[2px] border-dashed border-[#3F3F3F]"
              >
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {comment.commenter_display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      at {formatTime(comment.comment.timestamp)}
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
                {comment.comment.text && (
                  <div className="mt-2 text-sm whitespace-pre-wrap">
                    <CommentTextWithLinks
                      text={comment.comment.text}
                      links={comment.comment.links}
                    />
                  </div>
                )}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};