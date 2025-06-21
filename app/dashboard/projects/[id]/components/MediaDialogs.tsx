"use client";

import React from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Copy,
  Loader2,
  ExternalLink,
  Link,
  Share,
  Check,
  Trash2,
} from "lucide-react";
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
}

interface ReviewLink {
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  media_id: string;
}

interface MediaDialogsProps {
  createLinkDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  };
  viewLinksDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  };
  deleteDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  };
  onCreateLinkDialogChange: (dialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  }) => void;
  onViewLinksDialogChange: (dialog: {
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  }) => void;
  onDeleteDialogChange: (dialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  }) => void;
  onCreateReviewLink: (mediaFile: MediaFile, title: string) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
}

export function MediaDialogs({
  createLinkDialog,
  viewLinksDialog,
  deleteDialog,
  onCreateLinkDialogChange,
  onViewLinksDialogChange,
  onDeleteDialogChange,
  onCreateReviewLink,
  onToggleReviewLink,
  onDeleteMedia,
}: MediaDialogsProps) {
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
    <>
      {/* Create Review Link Dialog */}
      <Dialog
        open={createLinkDialog.open}
        onOpenChange={(open) =>
          onCreateLinkDialogChange({
            open,
            isCreating: false,
            showSuccess: false,
          })
        }
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {createLinkDialog.showSuccess
                ? "Review Link Created!"
                : "Create Review Link"}
            </DialogTitle>
          </DialogHeader>

          {createLinkDialog.showSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Link created successfully!
                    </p>
                    <p className="text-sm text-gray-400">
                      The link has been copied to your clipboard
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Review Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createLinkDialog.createdUrl || ""}
                    readOnly
                    className="font-mono text-sm bg-gray-700 border-gray-600 text-white"
                  />
                  <RevButtons
                    variant="outline"
                    onClick={() =>
                      handleCopyReviewLink(
                        createLinkDialog.createdUrl?.split("/").pop() || ""
                      )
                    }
                    className="border-gray-600 text-gray-300 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </RevButtons>
                  <RevButtons
                    variant="outline"
                    onClick={() =>
                      window.open(createLinkDialog.createdUrl, "_blank")
                    }
                    className="border-gray-600 text-gray-300 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </RevButtons>
                </div>
              </div>

              <div className="flex justify-end">
                <RevButtons
                  onClick={() =>
                    onCreateLinkDialogChange({
                      open: false,
                      isCreating: false,
                      showSuccess: false,
                    })
                  }
                >
                  Done
                </RevButtons>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                if (createLinkDialog.mediaFile) {
                  onCreateReviewLink(createLinkDialog.mediaFile, title);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Review Title (Optional)
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a title for this review"
                  defaultValue={createLinkDialog.mediaFile?.original_filename}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <RevButtons
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onCreateLinkDialogChange({
                      open: false,
                      isCreating: false,
                      showSuccess: false,
                    })
                  }
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  Cancel
                </RevButtons>
                <RevButtons
                  type="submit"
                  disabled={createLinkDialog.isCreating}
                >
                  {createLinkDialog.isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Create & Copy Link
                    </>
                  )}
                </RevButtons>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Review Links Dialog */}
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
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Review Links</DialogTitle>
            {viewLinksDialog.mediaFile && (
              <p className="text-sm text-gray-400">
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
              <div className="text-center py-8 text-gray-500">
                <Share className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No review links created yet</p>
                <p className="text-sm">
                  Create your first review link to share this media
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {viewLinksDialog.links.map((link) => (
                  <Card
                    key={link.id}
                    className="p-4 bg-gray-700 border-gray-600"
                  >
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
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Created {formatDate(link.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-600 px-2 py-1 rounded flex-1 truncate text-gray-300">
                            {getReviewUrl(link.link_token)}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyReviewLink(link.link_token)}
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(getReviewUrl(link.link_token), "_blank")
                          }
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant={link.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            onToggleReviewLink(link.id, link.is_active)
                          }
                        >
                          {link.is_active ? "Deactivate" : "Activate"}
                        </RevButtons>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          onDeleteDialogChange({
            open,
            isDeleting: false,
          })
        }
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "
              {deleteDialog.mediaFile?.original_filename}"? This action cannot
              be undone and will also disable all review links for this media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.mediaFile && onDeleteMedia(deleteDialog.mediaFile)
              }
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteDialog.isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
