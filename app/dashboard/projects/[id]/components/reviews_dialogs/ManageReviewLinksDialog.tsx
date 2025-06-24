// aa/app/dashboard/projects/[id]/components/reviews_Dialogs/ManageReviewLinksDialog.tsx
"use client";

import React, { useState } from "react";
import {
  Copy,
  ExternalLink,
  Settings,
  Loader2,
  Lock,
  Calendar,
  Trash2,
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
      open={manageLinksDialog.open}
      onOpenChange={(open) =>
        onManageLinksDialogChange({
          open,
          links: [],
          isLoading: false,
        })
      }
    >
      <DialogContent className="max-w-3xl bg-primary-foreground">
        <DialogHeader>
          <DialogTitle>Manage Review Links</DialogTitle>
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
                  <Card key={link.id} className="p-4 bg-secondary">
                    <div className="space-y-4">
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
                            
                            />
                            <Button 
                              variant="destructive"
                              onClick={() => onDeleteReviewLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center mt-3 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={link.is_active}
                                onCheckedChange={(checked) =>
                                  onToggleReviewLink(link.id, !checked)
                                }
                              />
                              <Label className="text-sm">Active</Label>
                            </div>
                            {link.requires_password && (
                              <Badge variant="green">
                                <Lock className="h-3 w-3 mr-1" />
                                Protected
                              </Badge>
                            )}
                            {link.expires_at && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Expires {formatDate(link.expires_at)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created {formatDate(link.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="text-xs border-2 bg-[#121212] border-[#262626] px-2 py-1 rounded flex-1 truncate text-gray-300">
                          {getReviewUrl(link.link_token)}
                        </code>
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
