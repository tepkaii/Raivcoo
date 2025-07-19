// app/dashboard/projects/[id]/components/reviews_Dialogs/ManageReviewLinksDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Crown, Trash2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MediaFile, ReviewLink } from "@/app/dashboard/lib/types";
import {
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  LockClosedIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { getSubscriptionInfo } from "@/app/dashboard/lib/actions";
import { createClient } from "@/utils/supabase/client";
import { formatDate } from "@/app/dashboard/lib/formats";
import { deleteAllReviewLinksAction } from "../../lib/GeneralActions";

interface ManageLinksDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  links: ReviewLink[];
  isLoading: boolean;
}

interface ReviewLinkPermissions {
  canSetPassword: boolean;
  canDisableDownload: boolean;
  planName: string;
  isActive: boolean;
}

interface ManageReviewLinksDialogProps {
  manageLinksDialog: ManageLinksDialogState;
  onManageLinksDialogChange: (dialog: ManageLinksDialogState) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
  onUpdateReviewLink: (linkId: string, updates: any) => void;
  onDeleteReviewLink: (linkId: string) => void;
  onReviewLinksUpdated?: (newLinks: ReviewLink[]) => void;
  reviewLinks: ReviewLink[]; // ✅ ADD THIS
  projectId: string; // ✅ Add this
}

export function ManageReviewLinksDialog({
  manageLinksDialog,
  onManageLinksDialogChange,
  onToggleReviewLink,
  onUpdateReviewLink,
  onDeleteReviewLink,
  onReviewLinksUpdated,
  reviewLinks,
}: ManageReviewLinksDialogProps) {
  const [editingLinkTitles, setEditingLinkTitles] = useState<{
    [key: string]: string;
  }>({});
  const [permissions, setPermissions] = useState<ReviewLinkPermissions | null>(
    null
  );
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Load permissions when dialog opens
  useEffect(() => {
    if (manageLinksDialog.open) {
      loadPermissions();
    }
  }, [manageLinksDialog.open]);

  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const subscriptionInfo = await getSubscriptionInfo(user.id);

      const hasActiveSubscription =
        subscriptionInfo.hasPaidPlan &&
        subscriptionInfo.isActive &&
        !subscriptionInfo.isExpired;

      let perms: ReviewLinkPermissions;

      if (hasActiveSubscription) {
        perms = {
          canSetPassword: true,
          canDisableDownload: true,
          planName: subscriptionInfo.planName,
          isActive: true,
        };
      } else {
        perms = {
          canSetPassword: false,
          canDisableDownload: false,
          planName: subscriptionInfo.planName,
          isActive: false,
        };
      }

      setPermissions(perms);
    } catch (error) {
      console.error("Failed to load permissions:", error);

      setPermissions({
        canSetPassword: false,
        canDisableDownload: false,
        planName: "Free",
        isActive: false,
      });
    } finally {
      setIsLoadingPermissions(false);
    }
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

  const handleDownloadToggle = (
    linkId: string,
    currentAllowDownload: boolean
  ) => {
    if (!permissions?.canDisableDownload) {
      toast({
        title: "Feature Not Available",
        description: "Upgrade to Lite or Pro to control download permissions",
        variant: "destructive",
      });
      return;
    }

    onUpdateReviewLink(linkId, {
      allow_download: !currentAllowDownload,
    });

    toast({
      title: "Download Permission Updated",
      description: `Downloads ${!currentAllowDownload ? "enabled" : "disabled"} for this review link`,
      variant: "default",
    });
  };

  // Delete all links directly using Supabase
  const handleDeleteAllLinks = async () => {
    if (!manageLinksDialog.mediaFile) {
      toast({
        title: "Error",
        description: "No media file selected",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAll(true);

    try {
      // ✅ Use the action instead of direct Supabase
      const result = await deleteAllReviewLinksAction(
        manageLinksDialog.mediaFile.id
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "All Links Deleted",
        description: result.message,
        variant: "green",
      });

      // ✅ Filter from parent reviewLinks properly
      if (onReviewLinksUpdated) {
        const updatedLinks = reviewLinks.filter(
          (link) => link.media_id !== manageLinksDialog.mediaFile!.id
        );
        onReviewLinksUpdated(updatedLinks);
      }

      // Close the dialog
      onManageLinksDialogChange({
        open: false,
        links: [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting all links:", error);
      toast({
        title: "Failed to Delete All Links",
        description:
          error instanceof Error
            ? error.message
            : "Could not delete all links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    onManageLinksDialogChange({
      open: false,
      links: [],
      isLoading: false,
    });
  };

  return (
    <Dialog open={manageLinksDialog.open} onOpenChange={handleCloseDialog}>
      <DialogContent className=" flex flex-col " showCloseButton={false}>
        {/* Custom Header with Manual Close Button */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center gap-2">
                Manage Review Links
                {permissions && (
                  <Badge
                    variant={permissions.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {permissions.planName}
                  </Badge>
                )}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Delete All Button */}
              {manageLinksDialog.links.length > 1 && !isDeletingAll && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllLinks}
                  disabled={isDeletingAll}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All ({manageLinksDialog.links.length})
                </Button>
              )}

              {/* Loading state for delete all */}
              {isDeletingAll && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting All...
                </Button>
              )}
            </div>
          </div>

          {manageLinksDialog.mediaFile && (
            <p className="text-sm text-muted-foreground">
              Managing links for:{" "}
              {manageLinksDialog.mediaFile.original_filename}
            </p>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {manageLinksDialog.isLoading || isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : manageLinksDialog.links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No review links to manage</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-4 pr-2">
                {manageLinksDialog.links.map((link) => {
                  const editingTitle =
                    editingLinkTitles[link.id] !== undefined
                      ? editingLinkTitles[link.id]
                      : link.title || "";

                  const handleTitleUpdate = () => {
                    const newTitle = editingLinkTitles[link.id];
                    if (
                      newTitle !== undefined &&
                      newTitle !== (link.title || "")
                    ) {
                      onUpdateReviewLink(link.id, { title: newTitle });
                    }
                    setEditingLinkTitles((prev) => {
                      const updated = { ...prev };
                      delete updated[link.id];
                      return updated;
                    });
                  };

                  return (
                    <Card key={link.id} className="p-4">
                      <div className="space-y-4">
                        {/* Title and Delete Button Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingLinkTitles((prev) => ({
                                    ...prev,
                                    [link.id]: e.target.value,
                                  }))
                                }
                                onBlur={handleTitleUpdate}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleTitleUpdate();
                                    e.currentTarget.blur();
                                  }
                                  if (e.key === "Escape") {
                                    setEditingLinkTitles((prev) => {
                                      const updated = { ...prev };
                                      delete updated[link.id];
                                      return updated;
                                    });
                                    e.currentTarget.blur();
                                  }
                                }}
                                placeholder="Link title"
                                className="flex-1"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => onDeleteReviewLink(link.id)}
                                title="Delete this review link"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Settings and Badges Row */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Settings Toggles */}
                          <div className="flex flex-wrap items-center gap-4">
                            {/* Active Toggle */}
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={link.is_active}
                                onCheckedChange={(checked) =>
                                  onToggleReviewLink(link.id, !checked)
                                }
                              />
                              <Label className="text-sm">Active</Label>
                            </div>

                            {/* Download Permission Toggle */}
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={link.allow_download ?? true}
                                onCheckedChange={() =>
                                  handleDownloadToggle(
                                    link.id,
                                    link.allow_download ?? true
                                  )
                                }
                                disabled={!permissions?.canDisableDownload}
                              />
                              <Label className="text-sm flex items-center gap-1">
                                Allow Downloads
                                {!permissions?.canDisableDownload && (
                                  <Crown className="h-3 w-3 text-orange-500" />
                                )}
                              </Label>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {link.requires_password && (
                              <Badge variant="secondary">
                                <LockClosedIcon className="h-3 w-3 mr-1" />
                                Protected
                              </Badge>
                            )}

                            {link.expires_at && (
                              <Badge variant="outline">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Expires {formatDate(link.expires_at)}
                              </Badge>
                            )}

                            {/* Plan restrictions info */}
                            {!permissions?.canDisableDownload && (
                              <Badge variant="outline" className="text-xs">
                                Lite/Pro for download control
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Creation Date */}
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(link.created_at)}
                        </div>

                        {/* URL and Action Buttons */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-primary-foreground border p-2 rounded flex-1 truncate text-gray-300 min-w-0">
                              {getReviewUrl(link.link_token)}
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleCopyReviewLink(link.link_token)
                              }
                              title="Copy link to clipboard"
                              className="flex-shrink-0"
                            >
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                window.open(
                                  getReviewUrl(link.link_token),
                                  "_blank"
                                )
                              }
                              title="Open link in new tab"
                              className="flex-shrink-0"
                            >
                              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}