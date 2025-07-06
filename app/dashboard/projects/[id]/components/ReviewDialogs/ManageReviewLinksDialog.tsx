// aa/app/dashboard/projects/[id]/components/reviews_Dialogs/ManageReviewLinksDialog.tsx
// @ts-nocheck
"use client";

import React, { useState } from "react";
import {

  Settings,
  Loader2,
} from "lucide-react";

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
  LockClosedIcon, 
  TrashIcon,
} from "@heroicons/react/24/solid";

interface ManageLinksDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  links: ReviewLink[];
  isLoading: boolean;
}

interface ManageReviewLinksDialogProps {
  manageLinksDialog: ManageLinksDialogState;
  onManageLinksDialogChange: (dialog: ManageLinksDialogState) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
  onUpdateReviewLink: (linkId: string, updates: any) => void;
  onDeleteReviewLink: (linkId: string) => void;
}

export function ManageReviewLinksDialog({
  manageLinksDialog,
  onManageLinksDialogChange,
  onToggleReviewLink,
  onUpdateReviewLink,
  onDeleteReviewLink,
}: ManageReviewLinksDialogProps) {
  const [editingLinkTitles, setEditingLinkTitles] = useState<{
    [key: string]: string;
  }>({});

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

  // ✅ HANDLE DOWNLOAD PERMISSION TOGGLE
  const handleDownloadToggle = (linkId: string, currentAllowDownload: boolean) => {
    onUpdateReviewLink(linkId, { 
      allow_download: !currentAllowDownload 
    });
    
    toast({
      title: "Download Permission Updated",
      description: `Downloads ${!currentAllowDownload ? 'enabled' : 'disabled'} for this review link`,
      variant: "default",
    });
  };

  return (
    <Dialog
      open={manageLinksDialog.open}
      onOpenChange={(open) =>
        onManageLinksDialogChange({
          open,
          links: [],
          isLoading: false,
        })
      }
    >
      <DialogContent className="max-w-4xl"> {/* ✅ WIDER DIALOG FOR MORE CONTENT */}
        <DialogHeader>
          <DialogTitle>View Review Links</DialogTitle>
          {manageLinksDialog.mediaFile && (
            <p className="text-sm text-muted-foreground">
              Managing links for:{" "}
              {manageLinksDialog.mediaFile.original_filename}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {manageLinksDialog.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : manageLinksDialog.links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No review links to manage</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
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
                      <div className="flex items-start justify-between">
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
                              size="sm"
                              onClick={() => onDeleteReviewLink(link.id)}
                              title="Delete this review link"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Settings and Badges Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* ✅ SETTINGS TOGGLES */}
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

                          {/* ✅ DOWNLOAD PERMISSION TOGGLE */}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={link.allow_download ?? false}
                              onCheckedChange={() =>
                                handleDownloadToggle(link.id, link.allow_download ?? false)
                              }
                            />
                            <Label className="text-sm flex items-center gap-1">
                             
                              Allow Downloads
                            </Label>
                          </div>
                        </div>

                        {/* ✅ BADGES */}
                        <div className="flex flex-wrap items-center gap-2">
                          {link.requires_password && (
                            <Badge variant="green">
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                          
                          {/* ✅ DOWNLOAD STATUS BADGE */}
                        

                          {link.expires_at && (
                            <Badge variant="outline">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Expires {formatDate(link.expires_at)}
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
                          <code className="text-xs bg-primary-foreground border px-2 py-1 rounded flex-1 truncate text-gray-300">
                            {getReviewUrl(link.link_token)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyReviewLink(link.link_token)}
                            title="Copy link to clipboard"
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(getReviewUrl(link.link_token), "_blank")
                            }
                            title="Open link in new tab"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}