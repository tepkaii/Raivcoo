// app/review/[token]/review_components/VersionSelector.tsx
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaVersion {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  file_size: number;
  version_number: number;
  is_current_version: boolean;
  uploaded_at: string;
  r2_url: string;
}

interface VersionSelectorProps {
  currentMedia: MediaVersion;
  allVersions: MediaVersion[];
  onVersionChange: (version: MediaVersion) => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  currentMedia,
  allVersions,
  onVersionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVersionSelect = (version: MediaVersion) => {
    onVersionChange(version);
    setIsOpen(false);
  };

  // Sort versions by version number (newest first)
  const sortedVersions = [...allVersions].sort(
    (a, b) => b.version_number - a.version_number
  );

  return (
    <div className="flex items-center gap-3">
      {/* Current Version Selector */}
      <div className="relative">
        <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
          <Badge variant="outline">v{currentMedia.version_number}</Badge>
          {currentMedia.is_current_version && (
            <Badge variant="default">Latest</Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-background border  rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border">
              <h3 className="text-sm font-medium text-white">All Versions</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 hover:bg-secondary cursor-pointer border-b border last:border-b-0 ${
                    version.id === currentMedia.id
                      ? "bg-primary-foreground"
                      : ""
                  }`}
                  onClick={() => handleVersionSelect(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">v{version.version_number}</Badge>
                      {version.is_current_version && (
                        <Badge variant="default">Latest</Badge>
                      )}
                      {version.id === currentMedia.id && (
                        <Check className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(version.file_size)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    {version.original_filename}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(version.uploaded_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};
