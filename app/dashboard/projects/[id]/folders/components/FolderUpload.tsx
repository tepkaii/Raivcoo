// app/dashboard/projects/[id]/folders/components/FolderUpload.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FolderOpenIcon } from "@heroicons/react/24/solid";

interface FolderUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUploadComplete: (files: any[], folders: any[]) => void;
}

export function FolderUpload({
  open,
  onOpenChange,
  projectId,
  onUploadComplete,
}: FolderUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderStructure, setFolderStructure] = useState<string[]>([]);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const filePaths = files.map((file) => file.webkitRelativePath || file.name);

    setSelectedFiles(files);
    setFolderStructure(filePaths);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file, index) => {
        formData.append("files", file);
        formData.append("filePaths", folderStructure[index]);
      });

      const rootFolderName = folderStructure[0]?.split("/")[0] || "Upload";
      formData.append("rootFolderName", rootFolderName);

      const response = await fetch(`/api/projects/${projectId}/upload-folder`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      onUploadComplete(result.files, result.folders);

      // Reset state
      setSelectedFiles([]);
      setFolderStructure([]);
      setUploadProgress(0);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setFolderStructure([]);
    setUploadProgress(0);
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folder Selection */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FolderOpenIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Select a folder to upload all its contents
            </p>
            <Button
              variant="outline"
              onClick={() =>
                document.getElementById("folder-upload-input")?.click()
              }
              disabled={isUploading}
            >
              <FolderOpenIcon className="h-4 w-4 mr-2" />
              Select Folder
            </Button>
            <input
              id="folder-upload-input"
              type="file"
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              multiple
              className="hidden"
              onChange={handleFolderSelect}
              disabled={isUploading}
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedFiles.length} files selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-1 bg-muted/50 rounded p-2">
                {folderStructure.slice(0, 10).map((path, index) => (
                  <div key={index} className="truncate">
                    {path}
                  </div>
                ))}
                {folderStructure.length > 10 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {folderStructure.length - 10} more files
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading folder...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            {selectedFiles.length > 0 && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Folder
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
