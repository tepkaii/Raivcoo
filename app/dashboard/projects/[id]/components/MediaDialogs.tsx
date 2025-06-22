"use client";

import React, { useState } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

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
  Calendar,
  Lock,
  Settings,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatFileSize } from "./MediaCard";
import { VersionDragList } from "./VersionDragList";

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

interface OrganizedMedia {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
  versions: MediaFile[];
  currentVersion: MediaFile;
  hasReviewLinks: boolean;
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
  manageLinksDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  };
  versionManagerDialog: {
    open: boolean;
    media?: OrganizedMedia;
    isUpdating: boolean;
  };
  deleteDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  };
  onCreateLinkDialogChange: (dialog: any) => void;
  onViewLinksDialogChange: (dialog: any) => void;
  onManageLinksDialogChange: (dialog: any) => void;
  onVersionManagerDialogChange: (dialog: any) => void;
  onDeleteDialogChange: (dialog: any) => void;
  onCreateReviewLink: (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
    }
  ) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
  onUpdateReviewLink: (linkId: string, updates: any) => void;
  onDeleteReviewLink: (linkId: string) => void;
  onVersionReorder: (parentId: string, reorderedVersions: MediaFile[]) => void;
  onUpdateVersionName: (versionId: string, name: string) => void;
  onDeleteVersion: (versionId: string) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
}

export function MediaDialogs({
  createLinkDialog,
  viewLinksDialog,
  manageLinksDialog,
  versionManagerDialog,
  deleteDialog,
  onCreateLinkDialogChange,
  onViewLinksDialogChange,
  onManageLinksDialogChange,
  onVersionManagerDialogChange,
  onDeleteDialogChange,
  onCreateReviewLink,
  onToggleReviewLink,
  onUpdateReviewLink,
  onDeleteReviewLink,
  onVersionReorder,
  onUpdateVersionName,
  onDeleteVersion,
  onDeleteMedia,
}: MediaDialogsProps) {
  const [linkFormData, setLinkFormData] = useState({
    title: "",
    expiresAt: "",
    requiresPassword: false,
    password: "",
  });

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

  const getAllVersionsOrdered = (media: OrganizedMedia) => {
    const parent = {
      id: media.id,
      filename: media.filename,
      original_filename: media.original_filename,
      file_type: media.file_type,
      mime_type: media.mime_type,
      file_size: media.file_size,
      r2_url: media.r2_url,
      uploaded_at: media.uploaded_at,
      version_number: media.version_number,
      is_current_version: media.is_current_version,
      version_name: media.version_name,
    };

    const allVersions = [parent, ...media.versions].sort(
      (a, b) => a.version_number - b.version_number
    );

    // Current version is always first
    const currentIndex = allVersions.findIndex((v) => v.is_current_version);
    const currentVersion = allVersions[currentIndex];
    const otherVersions = allVersions.filter((_, i) => i !== currentIndex);

    return [currentVersion, ...otherVersions];
  };

  const onVersionDragEnd = (result: any) => {
    if (!result.destination || !versionManagerDialog.media) return;

    const versions = getAllVersionsOrdered(versionManagerDialog.media);
    const [reorderedItem] = versions.splice(result.source.index, 1);
    versions.splice(result.destination.index, 0, reorderedItem);

    // Update version numbers based on new order
    const reorderedVersions = versions.map((version, index) => ({
      ...version,
      version_number: index + 1,
      is_current_version: index === 0, // First item is current
    }));

    onVersionReorder(versionManagerDialog.media.id, reorderedVersions);
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
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
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
                if (createLinkDialog.mediaFile) {
                  onCreateReviewLink(createLinkDialog.mediaFile, {
                    title: linkFormData.title,
                    expiresAt: linkFormData.expiresAt || undefined,
                    requiresPassword: linkFormData.requiresPassword,
                    password: linkFormData.password || undefined,
                  });
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
                  value={linkFormData.title}
                  onChange={(e) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter a title for this review"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="expiresAt" className="text-gray-300">
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={linkFormData.expiresAt}
                  onChange={(e) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for permanent link
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresPassword"
                  checked={linkFormData.requiresPassword}
                  onCheckedChange={(checked) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      requiresPassword: checked,
                    }))
                  }
                />
                <Label htmlFor="requiresPassword" className="text-gray-300">
                  Require password to access
                </Label>
              </div>

              {linkFormData.requiresPassword && (
                <div>
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={linkFormData.password}
                    onChange={(e) =>
                      setLinkFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required={linkFormData.requiresPassword}
                  />
                </div>
              )}

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
                          {link.requires_password && (
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                          {link.expires_at && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              Expires
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Created {formatDate(link.created_at)}
                          {link.expires_at && (
                            <span>
                              {" "}
                              • Expires {formatDate(link.expires_at)}
                            </span>
                          )}
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

      {/* Manage Review Links Dialog */}
      <Dialog
        open={versionManagerDialog.open}
        onOpenChange={(open) =>
          onVersionManagerDialogChange({
            open,
            isUpdating: false,
          })
        }
      >
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Manage Versions</DialogTitle>
            {versionManagerDialog.media && (
              <p className="text-sm text-gray-400">
                Managing versions for:{" "}
                {versionManagerDialog.media.original_filename}
              </p>
            )}
          </DialogHeader>

          {versionManagerDialog.media && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                <p>
                  Drag versions to reorder them. Higher version numbers appear
                  at the top. The current version is marked with a star.
                </p>
              </div>

              <VersionDragList
                versions={getAllVersionsOrdered(versionManagerDialog.media)}
                onReorder={(reorderedVersions) => {
                  // Update dialog state immediately for dynamic UI
                  const updatedMedia = {
                    ...versionManagerDialog.media!,
                    versions: reorderedVersions.slice(1), // Remove parent from versions array
                    currentVersion: reorderedVersions[0],
                    version_number:
                      reorderedVersions.find(
                        (v) => v.id === versionManagerDialog.media!.id
                      )?.version_number || 1,
                    is_current_version:
                      reorderedVersions.find(
                        (v) => v.id === versionManagerDialog.media!.id
                      )?.is_current_version || false,
                  };

                  onVersionManagerDialogChange({
                    open: true,
                    media: updatedMedia,
                    isUpdating: false,
                  });

                  // Call backend
                  onVersionReorder(
                    versionManagerDialog.media!.id,
                    reorderedVersions
                  );
                }}
                onDeleteVersion={(versionId, updatedVersions) => {
                  // Update dialog state immediately for dynamic UI
                  const updatedMedia = {
                    ...versionManagerDialog.media!,
                    versions: updatedVersions.slice(1), // Remove parent from versions array
                    currentVersion: updatedVersions[0],
                    version_number:
                      updatedVersions.find(
                        (v) => v.id === versionManagerDialog.media!.id
                      )?.version_number || 1,
                    is_current_version:
                      updatedVersions.find(
                        (v) => v.id === versionManagerDialog.media!.id
                      )?.is_current_version || false,
                  };

                  onVersionManagerDialogChange({
                    open: true,
                    media: updatedMedia,
                    isUpdating: false,
                  });

                  // Call backend
                  onDeleteVersion(versionId);
                }}
                formatDate={formatDate}
                formatFileSize={(bytes: number) => {
                  if (bytes === 0) return "0 Bytes";
                  const k = 1024;
                  const sizes = ["Bytes", "KB", "MB", "GB"];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return (
                    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
                    " " +
                    sizes[i]
                  );
                }}
              />
            </div>
          )}
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