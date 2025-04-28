// ProjectComments.tsx
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { CommentTextWithLinks } from "@/app/dashboard/projects/[id]/CommentRenderer";
import { Circle, ExternalLink } from "lucide-react";

interface Comment {
  id: string;
  created_at: string;
  comment: {
    text: string;
    timestamp: number;
    images: string[];
    links: Array<{ url: string; text: string }>;
  };
}

interface ProjectCommentsProps {
  comments: Comment[];
  formatFullDate: (dateString: string | undefined | null) => string;
  openImageDialog: (imageUrl: string, altText: string) => void;
}

export function ProjectComments({
  comments,
  formatFullDate,
  openImageDialog,
}: ProjectCommentsProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4 border-2 rounded-md bg-muted/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
              Client
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFullDate(comment.created_at)}
            </span>
          </div>
          <div className="p-3 bg-muted/20 rounded-md text-sm">
            <CommentTextWithLinks
              text={comment.comment.text}
              links={comment.comment.links}
            />
          </div>
          {comment.comment.images && comment.comment.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {comment.comment.images.map((imageUrl, idx) => (
                <div
                  key={`${imageUrl}-${idx}`}
                  className="inline-block"
                  onClick={() =>
                    openImageDialog(imageUrl, `Reference image ${idx + 1}`)
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
        </Card>
      ))}
    </div>
  );
}
