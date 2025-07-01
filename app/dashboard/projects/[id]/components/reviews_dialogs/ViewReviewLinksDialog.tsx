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
import { MediaFile, ReviewLink } from "@/app/dashboard/lib/types";

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
        variant: "green",
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
      <DialogContent className="w-[95vw] max-w-4xl  flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b">
          <DialogTitle className="text-lg sm:text-xl">Review Links</DialogTitle>
          {viewLinksDialog.mediaFile && (
            <p className="text-sm text-muted-foreground break-all">
              Links for: {viewLinksDialog.mediaFile.original_filename}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-4 sm:px-6 pb-4">
          {viewLinksDialog.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : viewLinksDialog.links.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Share className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-base sm:text-lg font-medium mb-2">No review links created yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first review link to share this media
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pt-4">
              <div className="space-y-3 sm:space-y-4">
                {viewLinksDialog.links.map((link) => (
                  <Card key={link.id} className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Header with title and badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-white text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                            {link.title || "Untitled Review"}
                          </h4>
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {link.requires_password && (
                            <Badge variant="green" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Date info */}
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(link.created_at)}
                        {link.expires_at && (
                          <span className="block sm:inline">
                            <span className="hidden sm:inline"> • </span>
                            Expires {formatDate(link.expires_at)}
                          </span>
                        )}
                      </p>

                      {/* URL display */}
                      <div className="space-y-2">
                        <code className="text-xs bg-primary-foreground px-2 py-2 rounded block text-gray-300 break-all">
                          {getReviewUrl(link.link_token)}
                        </code>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyReviewLink(link.link_token)}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1 sm:mr-0" />
                            <span className="sm:hidden">Copy</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(getReviewUrl(link.link_token), "_blank")
                            }
                            className="flex-1 sm:flex-none text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1 sm:mr-0" />
                            <span className="sm:hidden">Open</span>
                          </Button>
                        </div>
                        <Button
                          variant={link.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            onToggleReviewLink(link.id, link.is_active)
                          }
                          className="text-xs"
                        >
                          {link.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}