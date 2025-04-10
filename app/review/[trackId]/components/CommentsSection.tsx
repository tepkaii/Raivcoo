// app/projects/[projectId]/review/[trackId]/components/CommentsSection.tsx
"use client";

import React from "react";
import { formatTime } from "../../lib/utils";
import { MessageSquareWarning, Play, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Comment {
  id: string;
  timestamp: number;
  comment: string;
  created_at: string;
  commenter_display_name: string;
  isOwnComment?: boolean;
}

interface CommentsSectionProps {
  comments: Comment[];
  isVideoFile: boolean;
  isAudioFile: boolean;
  jumpToTime: (time: number) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  isVideoFile,
  isAudioFile,
  jumpToTime,
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
                className={`p-3 border rounded-md ${
                  comment.isOwnComment
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {comment.commenter_display_name}{" "}
                      {comment.isOwnComment ? "(You)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      at {formatTime(comment.timestamp)}
                      {(isVideoFile || isAudioFile) && (
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
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {comment.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
