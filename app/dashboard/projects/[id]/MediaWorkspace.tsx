// app/dashboard/projects/[id]/MediaWorkspace.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileVideo,
  Image as ImageIcon,
  MoreVertical,
  Link,
  Eye,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  Plus,
  Download,
  ExternalLink,
  Calendar,
  Share,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
}

interface ReviewLink {
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_media: MediaFile[];
}

interface MediaWorkspaceProps {
  project: Project;
}

export function MediaWorkspace({ project }: MediaWorkspaceProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    project.project_media || []
  );

  // Review link dialog state
  const [reviewLinkDialog, setReviewLinkDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
  }>({ open: false });
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // View review links dialog state
  const [viewLinksDialog, setViewLinksDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
  }>({ open: false, links: [] });
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mediaFile?: MediaFile;
  }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        acceptedFiles.forEach((file) => {
          formData.append("files", file);
        });

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch (e) {
                reject(new Error("Invalid response format"));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || "Upload failed"));
              } catch (e) {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", `/api/projects/${project.id}/media`);
          xhr.send(formData);
        });

        const result = (await uploadPromise) as any;

        // Update local state with new files
        setMediaFiles((prev) => [...prev, ...result.files]);

        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Failed",
          description:
            error instanceof Error ? error.message : "Failed to upload files",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [project.id]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading,
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });

  const handleCreateReviewLink = async (
    mediaFile: MediaFile,
    title: string
  ) => {
    setIsCreatingLink(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/review-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId: mediaFile.id,
          title: title,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create review link");
      }

      // Copy review URL to clipboard
      await navigator.clipboard.writeText(result.reviewUrl);

      toast({
        title: "Review Link Created",
        description: "Review link has been copied to your clipboard!",
        variant: "success",
      });

      setReviewLinkDialog({ open: false });
    } catch (error) {
      console.error("Create review link error:", error);
      toast({
        title: "Failed to Create Review Link",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleViewReviewLinks = async (mediaFile: MediaFile) => {
    setIsLoadingLinks(true);
    setViewLinksDialog({ open: true, mediaFile, links: [] });

    try {
      const response = await fetch(
        `/api/projects/${project.id}/media/${mediaFile.id}/review-links`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch review links");
      }

      const result = await response.json();
      setViewLinksDialog({ open: true, mediaFile, links: result.links || [] });
    } catch (error) {
      console.error("Error fetching review links:", error);
      toast({
        title: "Failed to Load Review Links",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setViewLinksDialog({ open: false, links: [] });
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleDeleteMedia = async (mediaFile: MediaFile) => {
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/projects/${project.id}/media/${mediaFile.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete media");
      }

      // Remove from local state
      setMediaFiles((prev) => prev.filter((file) => file.id !== mediaFile.id));

      toast({
        title: "Media Deleted",
        description: "Media file has been permanently deleted",
        variant: "success",
      });

      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Delete media error:", error);
      toast({
        title: "Failed to Delete Media",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyReviewLink = async (linkToken: string) => {
    const reviewUrl = `${window.location.origin}/review/${linkToken}`;
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

  const handleToggleReviewLink = async (
    linkId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/review-links/${linkId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update link");
      }

      // Update local state
      setViewLinksDialog((prev) => ({
        ...prev,
        links: prev.links.map((link) =>
          link.id === linkId ? { ...link, is_active: !currentStatus } : link
        ),
      }));

      toast({
        title: "Link Updated",
        description: `Review link ${!currentStatus ? "activated" : "deactivated"}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to Update Link",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${isUploading ? "pointer-events-none opacity-50" : "hover:border-primary/50"}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Uploading files... {uploadProgress}%
                  </p>
                  <Progress
                    value={uploadProgress}
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop files here"
                      : "Drag & drop files here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: Videos (MP4, MOV, AVI, MKV, WebM) and Images (JPG,
                    PNG, GIF, WebP)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB per file
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Files Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Media Files ({mediaFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mediaFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No media files uploaded yet</p>
              <p className="text-sm">
                Start by uploading some videos or images
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {file.file_type === "image" ? (
                      <img
                        src={file.r2_url}
                        alt={file.original_filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={file.r2_url}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        preload="metadata"
                      />
                    )}

                    {/* File type badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {file.file_type === "video" ? (
                          <FileVideo className="h-3 w-3" />
                        ) : (
                          <ImageIcon className="h-3 w-3" />
                        )}
                        {file.file_type}
                      </Badge>
                    </div>

                    {/* Actions dropdown */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <RevButtons
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </RevButtons>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(file.r2_url, "_blank")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Size
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setReviewLinkDialog({
                                open: true,
                                mediaFile: file,
                              })
                            }
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Create Review Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewReviewLinks(file)}
                          >
                            <Share className="h-4 w-4 mr-2" />
                            View Review Links
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a
                              href={file.r2_url}
                              download={file.original_filename}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setDeleteDialog({ open: true, mediaFile: file })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3
                      className="font-medium truncate"
                      title={file.original_filename}
                    >
                      {file.original_filename}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <p>{formatFileSize(file.file_size)}</p>
                      <p>{formatDate(file.uploaded_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Review Link Dialog */}
      <Dialog
        open={reviewLinkDialog.open}
        onOpenChange={(open) => setReviewLinkDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Review Link</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get("title") as string;
              if (reviewLinkDialog.mediaFile) {
                handleCreateReviewLink(reviewLinkDialog.mediaFile, title);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Review Title (Optional)</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter a title for this review"
                defaultValue={reviewLinkDialog.mediaFile?.original_filename}
              />
            </div>

            <div className="flex justify-end gap-2">
              <RevButtons
                type="button"
                variant="outline"
                onClick={() => setReviewLinkDialog({ open: false })}
              >
                Cancel
              </RevButtons>
              <RevButtons type="submit" disabled={isCreatingLink}>
                {isCreatingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Create Review Link
                  </>
                )}
              </RevButtons>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Review Links Dialog */}
      <Dialog
        open={viewLinksDialog.open}
        onOpenChange={(open) => setViewLinksDialog({ open, links: [] })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Links</DialogTitle>
            {viewLinksDialog.mediaFile && (
              <p className="text-sm text-muted-foreground">
                Links for: {viewLinksDialog.mediaFile.original_filename}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingLinks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : viewLinksDialog.links.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No review links created yet</p>
                <p className="text-sm">
                  Create your first review link to share this media
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {viewLinksDialog.links.map((link) => (
                  <Card key={link.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">
                            {link.title || "Untitled Review"}
                          </h4>
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Created {formatDate(link.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                            {getReviewUrl(link.link_token)}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyReviewLink(link.link_token)}
                        >
                          <Copy className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(getReviewUrl(link.link_token), "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </RevButtons>
                        <RevButtons
                          variant={link.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            handleToggleReviewLink(link.id, link.is_active)
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
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteDialog.mediaFile?.original_filename}"? This action cannot
              be undone and will also disable all review links for this media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.mediaFile &&
                handleDeleteMedia(deleteDialog.mediaFile)
              }
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
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
    </div>
  );
}
