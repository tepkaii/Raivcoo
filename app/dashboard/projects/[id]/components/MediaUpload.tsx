// app/dashboard/projects/[id]/components/MediaUpload.tsx
"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
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

interface MediaUploadProps {
  projectId: string;
  onFilesUploaded: (files: MediaFile[]) => void;
}

export function MediaUpload({ projectId, onFilesUploaded }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append("files", file);
      });

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

        xhr.open("POST", `/api/projects/${projectId}/media`);
        xhr.send(formData);
      });

      const result = (await uploadPromise) as any;

      onFilesUploaded(result.files);

      toast({
        title: "Success",
        description: `Uploaded ${result.files.length} file(s)`,
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
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading,
    maxSize: 200 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
        ${
          isDragActive
            ? "border-blue-500 bg-blue-500/10 scale-105"
            : "border-gray-600 hover:border-gray-500 hover:bg-gray-900/50"
        }
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <div className="space-y-2">
            <p className="text-lg text-gray-300">
              Uploading files... {uploadProgress}%
            </p>
            <div className="w-full max-w-xs mx-auto bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-gray-800 rounded-full">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              {isDragActive ? "Drop files here" : "Drop files to upload"}
            </h3>
            <p className="text-gray-400 mb-4">or click anywhere to browse</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Supports: MP4, MOV, AVI, MKV, WebM videos</p>
              <p>JPG, PNG, GIF, WebP images</p>
              <p className="font-medium">Maximum: 200MB per file</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
