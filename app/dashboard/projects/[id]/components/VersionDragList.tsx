"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, Trash2, ChevronUp, ChevronDown } from "lucide-react";

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

interface VersionDragListProps {
  versions: MediaFile[];
  onReorder: (reorderedVersions: MediaFile[]) => void;
  onDeleteVersion: (versionId: string, updatedVersions: MediaFile[]) => void;
  formatDate: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
}

export function VersionDragList({
  versions,
  onReorder,
  onDeleteVersion,
  formatDate,
  formatFileSize,
}: VersionDragListProps) {
  // Filter out any undefined/null values first
  const validVersions = (versions || []).filter(
    (v): v is MediaFile =>
      v !== null &&
      v !== undefined &&
      typeof v === "object" &&
      v.id &&
      v.file_type &&
      v.original_filename &&
      typeof v.version_number === "number"
  );

  // Sort versions highest to lowest
  const sortedVersions = [...validVersions].sort(
    (a, b) => b.version_number - a.version_number
  );

  const handleMoveUp = (versionId: string, currentIndex: number) => {
    if (currentIndex === 0) return; // Already at top

    const newVersions = [...sortedVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex - 1, 0, movedItem);

    // Recalculate version numbers based on new positions
    const reorderedVersions = newVersions.map((version, index) => ({
      ...version,
      version_number: newVersions.length - index, // Highest number for first position
      is_current_version: index === 0, // First position is current
    }));

    onReorder(reorderedVersions);
  };

  const handleMoveDown = (versionId: string, currentIndex: number) => {
    if (currentIndex === sortedVersions.length - 1) return; // Already at bottom

    const newVersions = [...sortedVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex + 1, 0, movedItem);

    // Recalculate version numbers based on new positions
    const reorderedVersions = newVersions.map((version, index) => ({
      ...version,
      version_number: newVersions.length - index, // Highest number for first position
      is_current_version: index === 0, // First position is current
    }));

    onReorder(reorderedVersions);
  };

  const handleDeleteVersion = (versionId: string) => {
    const remainingVersions = sortedVersions.filter((v) => v.id !== versionId);

    // Recalculate version numbers for remaining versions
    const reorderedVersions = remainingVersions.map((version, index) => ({
      ...version,
      version_number: remainingVersions.length - index,
      is_current_version: index === 0,
    }));

    onDeleteVersion(versionId, reorderedVersions);
  };

  // Early return if no valid versions
  if (!sortedVersions || sortedVersions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No versions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {sortedVersions.map((version, index) => {
        // Extra safety check for each version
        if (!version || !version.id || !version.file_type) {
          console.warn("Skipping invalid version:", version);
          return null;
        }

        const totalVersions = sortedVersions.length;
        const displayVersionNumber = totalVersions - index;
        const canMoveUp = index > 0;
        const canMoveDown = index < sortedVersions.length - 1;

        return (
          <Card key={version.id} className="p-4 bg-gray-700 border-gray-600">
            <div className="flex items-center gap-4">
              {/* Arrow controls */}
              <div className="flex flex-col gap-1">
                <RevButtons
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveUp(version.id, index)}
                  disabled={!canMoveUp}
                  className="h-7 w-7 p-1 border-gray-500 bg-gray-700 text-gray-300 hover:text-white hover:border-gray-400 hover:bg-gray-600 disabled:opacity-30"
                  title="Move up (increase version)"
                >
                  <ChevronUp className="h-4 w-4" />
                </RevButtons>
                <RevButtons
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveDown(version.id, index)}
                  disabled={!canMoveDown}
                  className="h-7 w-7 p-1 border-gray-500 bg-gray-700 text-gray-300 hover:text-white hover:border-gray-400 hover:bg-gray-600 disabled:opacity-30"
                  title="Move down (decrease version)"
                >
                  <ChevronDown className="h-4 w-4" />
                </RevButtons>
              </div>

              {/* Thumbnail */}
              <div className="relative w-16 h-12 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                {version.file_type === "image" ? (
                  <img
                    src={version.r2_url}
                    alt={version.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={version.r2_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                )}
                <div className="absolute top-1 left-1">
                  <Badge
                    variant={version.is_current_version ? "default" : "outline"}
                    className="text-xs"
                  >
                    v{displayVersionNumber}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white text-sm">
                    {version.original_filename}
                  </h4>
                  {version.is_current_version && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>Version {displayVersionNumber}</p>
                  <p>{formatDate(version.uploaded_at)}</p>
                  <p>{formatFileSize(version.file_size)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <RevButtons
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(version.r2_url, "_blank")}
                >
                  <Eye className="h-4 w-4" />
                </RevButtons>
                {!version.is_current_version && (
                  <RevButtons
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVersion(version.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </RevButtons>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
