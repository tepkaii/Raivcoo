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
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {comment.comment.images.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="relative rounded-md overflow-hidden hover:border border-muted hover:border-primary transition-colors cursor-pointer"
                  onClick={() =>
                    openImageDialog(imageUrl, `Comment image ${idx + 1}`)
                  }
                  style={{
                    height: "160px",
                    width: "100%",
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={`Comment image ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 300px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-white" />
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
