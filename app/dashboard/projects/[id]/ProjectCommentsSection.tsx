// components/ProjectCommentsSection.tsx
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { CommentTextWithLinks } from "./CommentRenderer";
import { formatTime } from "@/app/review/lib/utils";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Circle, ExternalLink } from "lucide-react";

interface Comment {
  id: string;
  created_at: string;
  comment: {
    text: string;
    timestamp: number;
    images?: string[];
    links?: { url: string; text: string }[];
  };
  commenter_display_name: string;
}

interface ProjectCommentsSectionProps {
  comments: Comment[];
}

export const ProjectCommentsSection: React.FC<ProjectCommentsSectionProps> = ({
  comments,
}) => {
  // Image dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [currentImageAlt, setCurrentImageAlt] = useState<string>("");

  // Image dialog handler
  const openImageDialog = (imageUrl: string, altText: string) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageAlt(altText);
    setImageDialogOpen(true);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Feedback History
          <span className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {comments.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No feedback comments yet.
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-md border-[2px] border-dashed"
              >
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {comment.comment.images.map((imageUrl, idx) => (
                        <div
                          key={`${imageUrl}-${idx}`}
                          className="inline-block"
                          onClick={() =>
                            openImageDialog(
                              imageUrl,
                              `Reference image ${idx + 1}`
                            )
                          }
                        >
                          <div className="relative rounded-md overflow-hidden border border-muted hover:border-primary transition-colors cursor-pointer">
                            <Image
                              src={imageUrl}
                              alt={`Reference image ${idx + 1}`}
                              height={160}
                              width={0}
                              className="max-h-[160px] w-auto group-hover:opacity-90 transition-opacity"
                              style={{ display: "block" }}
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] p-4 max-h-[95vh]">
          <DialogHeader className="flex flex-row justify-between items-center p-2"></DialogHeader>
          <div className="overflow-auto flex justify-center items-center bg-black border border-muted rounded-md max-h-[calc(95vh-100px)]">
            <img
              src={currentImageUrl}
              alt={currentImageAlt}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
              className="h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};