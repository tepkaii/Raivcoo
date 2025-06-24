// components/reviews_Dialogs/ViewReviewLinksDialog.tsx

"use client";

import React from "react";
import { Copy, ExternalLink, Share, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
}

interface ReviewLink {
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  media_id: string;
  password_hash?: string;
  requires_password: boolean;
}

interface ViewLinksDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  links: ReviewLink[];
  isLoading: boolean;
}

interface ViewReviewLinksDialogProps {
  viewLinksDialog: ViewLinksDialogState;
  onViewLinksDialogChange: (dialog: ViewLinksDialogState) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
}

export function ViewReviewLinksDialog({
  viewLinksDialog,
  onViewLinksDialogChange,
  onToggleReviewLink,
}: ViewReviewLinksDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReviewUrl = (linkToken: string) => {
    return `${window.location.origin}/review/${linkToken}`;
  };

  const handleCopyReviewLink = async (linkToken: string) => {
    const reviewUrl = getReviewUrl(linkToken);
    try {
      await navigator.clipboard.writeText(reviewUrl);
      toast({
        title: "Link Copied",
        description: "Review link copied to clipboard",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={viewLinksDialog.open}
      onOpenChange={(open) =>
        onViewLinksDialogChange({
          open,
          links: [],
          isLoading: false,
        })
      }
    >
      <DialogContent className="max-w-3xl bg-primary-foreground">
        <DialogHeader>
          <DialogTitle>Review Links</DialogTitle>
          {viewLinksDialog.mediaFile && (
            <p className="text-sm text-muted-foreground">
              Links for: {viewLinksDialog.mediaFile.original_filename}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {viewLinksDialog.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : viewLinksDialog.links.length === 0 ? (
            <div className="text-center py-8">
              <Share className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No review links created yet</p>
              <p className="text-sm">
                Create your first review link to share this media
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {viewLinksDialog.links.map((link) => (
                <Card key={link.id} className="p-4 bg-secondary">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate text-white">
                          {link.title || "Untitled Review"}
                        </h4>
                        <Badge
                          variant={link.is_active ? "default" : "secondary"}
                        >
                          {link.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {link.requires_password && (
                          <Badge variant="green">
                            <Lock className="h-3 w-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Created {formatDate(link.created_at)}
                        {link.expires_at && (
                          <span> • Expires {formatDate(link.expires_at)}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate text-gray-300">
                          {getReviewUrl(link.link_token)}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyReviewLink(link.link_token)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(getReviewUrl(link.link_token), "_blank")
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={link.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          onToggleReviewLink(link.id, link.is_active)
                        }
                      >
                        {link.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
