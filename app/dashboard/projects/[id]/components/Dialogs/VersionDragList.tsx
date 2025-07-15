// @ts-nocheck
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/app/dashboard/lib/types";
import {
  EyeIcon,
  TrashIcon,
  VideoCameraIcon,
  PhotoIcon,
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import { deleteVersionAction } from "../../lib/DeleteMediaActions";

interface VersionDragListProps {
  versions: MediaFile[];
  onReorder: (reorderedVersions: MediaFile[]) => void;
  onDeleteVersion: (versionId: string, updatedVersions: MediaFile[]) => void;
  formatDate: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
  projectId: string;
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
  onParentDeleted?: () => void;
  onVersionDeleted?: (versionId: string) => void;
}

// Helper function to determine file category (same as MediaCard)
const getFileCategory = (fileType: string, mimeType: string) => {
  if (fileType === "video") return "video";
  if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType === "text/plain"
  )
    return "document";
  return "unknown";
};

// Helper function to truncate filename with responsive lengths
const truncateFilename = (
  filename: string,
  screenSize: "mobile" | "tablet" | "desktop" = "desktop"
) => {
  const maxLengths = {
    mobile: 15,
    tablet: 20, // Reduced from 25
    desktop: 25, // Reduced from 30 for better fit
  };

  const maxLength = maxLengths[screenSize];

  if (filename.length <= maxLength) return filename;

  const extension = filename.split(".").pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));

  if (extension && extension.length < maxLength - 5) {
    const availableLength = maxLength - extension.length - 4; // -4 for "..." and "."
    if (availableLength > 0) {
      return `${nameWithoutExt.substring(0, availableLength)}...${extension}`;
    }
  }

  return `${filename.substring(0, maxLength - 3)}...`;
};

export function VersionDragList({
  versions,
  onReorder,
  onDeleteVersion,
  formatDate,
  formatFileSize,
  projectId,
  onMediaUpdated,
  onParentDeleted,
  onVersionDeleted,
}: VersionDragListProps) {
  // ✅ Sort by display_order (for UI ordering) but preserve version_number (for history)
  const uniqueVersions = React.useMemo(() => {
    const versionMap = new Map();

    (versions || []).forEach((v) => {
      if (v && v.id && v.file_type) {
        versionMap.set(v.id, v);
      }
    });

    const uniqueVersions = Array.from(versionMap.values());

    // ✅ ONLY sort by display_order (highest = current = first)
    const sorted = uniqueVersions.sort((a, b) => {
      const aOrder = a.display_order ?? a.version_number;
      const bOrder = b.display_order ?? b.version_number;

      return bOrder - aOrder; // HIGHEST display_order appears FIRST = CURRENT
    });

    return sorted;
  }, [versions]);

  // ✅ Reorder only changes display_order, NOT version_number
  const handleMoveUp = async (versionId: string, currentIndex: number) => {
    if (currentIndex === 0) return;

    const newVersions = [...uniqueVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex - 1, 0, movedItem);

    // ✅ ONLY update display_order (highest = current)
    const reorderedVersions = newVersions.map((version, index) => {
      const newDisplayOrder = newVersions.length - index; // First item gets highest number
      return {
        ...version,
        display_order: newDisplayOrder,
        // ✅ Keep original is_current_version - we'll ignore it in favor of display_order
      };
    });

    await updateDisplayOrderInDatabase(reorderedVersions);
  };

  const handleMoveDown = async (versionId: string, currentIndex: number) => {
    if (currentIndex === uniqueVersions.length - 1) return;

    const newVersions = [...uniqueVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex + 1, 0, movedItem);

    // ✅ ONLY update display_order (highest = current)
    const reorderedVersions = newVersions.map((version, index) => {
      const newDisplayOrder = newVersions.length - index; // First item gets highest number

      return {
        ...version,
        display_order: newDisplayOrder,
        // ✅ Keep original is_current_version - we'll ignore it in favor of display_order
      };
    });

    await updateDisplayOrderInDatabase(reorderedVersions);
  };

  const handleDeleteVersion = async (versionId: string) => {
    const versionToDelete = uniqueVersions.find((v) => v.id === versionId);
    if (!versionToDelete || versionToDelete.is_current_version) {
      return;
    }

    try {
      const result = await deleteVersionAction(versionId);

      if (!result.success) {
        console.error("❌ VERSION DIALOG: Delete failed:", result.error);
        throw new Error(result.error);
      }

      // Get remaining versions - preserve their version_numbers
      const remainingVersions = uniqueVersions.filter(
        (v) => v.id !== versionId
      );

      onDeleteVersion(versionId, remainingVersions);

      if (onVersionDeleted) {
        onVersionDeleted(versionId);
      }

      await refreshProjectMedia();
    } catch (error) {
      console.error("❌ VERSION DIALOG: Failed to delete version:", error);
    }
  };

  // ✅ Update only display_order in database, not version_number
  const updateDisplayOrderInDatabase = async (
    reorderedVersions: MediaFile[]
  ) => {
    try {
      const supabase = createClient();

      // ✅ Find the highest display_order to determine current version
      const maxDisplayOrder = Math.max(
        ...reorderedVersions.map((v) => v.display_order)
      );

      // ✅ Update BOTH display_order AND is_current_version
      for (const version of reorderedVersions) {
        const isCurrent = version.display_order === maxDisplayOrder;

        const { error } = await supabase
          .from("project_media")
          .update({
            display_order: version.display_order,
            is_current_version: isCurrent, // ✅ Set current based on highest display_order
          })
          .eq("id", version.id);

        if (error) {
          console.error(`❌ Failed to update ${version.id}:`, error);
          throw error;
        }
      }

      onReorder(reorderedVersions);
      await refreshProjectMedia();
    } catch (error) {
      console.error("❌ Failed to update display order:", error);
    }
  };

  const refreshProjectMedia = async () => {
    try {
      const supabase = createClient();
      const { data: updatedMediaFiles, error } = await supabase
        .from("project_media")
        .select("*") // This will include display_order
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      if (updatedMediaFiles) {
        onMediaUpdated(updatedMediaFiles);
      }
    } catch (error) {
      console.error("Failed to refresh project media:", error);
    }
  };

  const handleDeleteParentMedia = async (mediaId: string) => {
    try {
      const { deleteMediaAction } = await import(
        "../../lib/DeleteMediaActions"
      );
      const result = await deleteMediaAction(projectId, mediaId);

      if (!result.success) {
        console.error("❌ VERSION DIALOG: Parent delete failed:", result.error);
        throw new Error(result.error);
      }

      if (onParentDeleted) {
        onParentDeleted();
      }

      await refreshProjectMedia();
    } catch (error) {
      console.error("❌ VERSION DIALOG: Failed to delete parent media:", error);
    }
  };

  if (!uniqueVersions || uniqueVersions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No versions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2 sm:p-0">
      {uniqueVersions.map((version, index) => {
        if (!version || !version.id || !version.file_type) {
          return null;
        }

        // ✅ Show original version_number (historical), not display_order
        const displayVersionNumber = version.version_number;
        const canMoveUp = index > 0;
        const canMoveDown = index < uniqueVersions.length - 1;

        return (
          <Card key={version.id} className="p-2 sm:p-3 overflow-hidden">
            {/* Mobile Layout (< 640px) */}
            <div className="block sm:hidden">
              <div className="flex items-start gap-2">
                {/* Thumbnail */}
                <div className="relative w-12 h-9 bg-secondary border-2 border-black/20 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {(() => {
                    const category = getFileCategory(
                      version.file_type,
                      version.mime_type
                    );

                    switch (category) {
                      case "image":
                        return (
                          <img
                            src={version.r2_url}
                            alt={version.original_filename}
                            className="w-full h-full object-cover"
                          />
                        );

                      case "video":
                        return version.thumbnail_r2_url ? (
                          <img
                            src={version.thumbnail_r2_url}
                            alt={`${version.original_filename} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <VideoCameraIcon className="h-4 w-4 text-white/80" />
                          </div>
                        );

                      case "audio":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-500 to-blue-800">
                            <MusicalNoteIcon className="h-4 w-4 text-white/80" />
                          </div>
                        );

                      case "svg":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-green-600 to-teal-800">
                            <CodeBracketIcon className="h-4 w-4 text-white/80" />
                          </div>
                        );

                      case "document":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <DocumentIcon className="h-4 w-4 text-white/80" />
                          </div>
                        );

                      default:
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <DocumentIcon className="h-4 w-4 text-white/80" />
                          </div>
                        );
                    }
                  })()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-medium text-white text-xs leading-tight truncate"
                        title={version.original_filename}
                      >
                        {truncateFilename(version.original_filename, "mobile")}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          v{displayVersionNumber}
                        </Badge>
                        {(() => {
                          const maxDisplayOrder = Math.max(
                            ...uniqueVersions.map(
                              (v) => v.display_order || v.version_number
                            )
                          );
                          const isCurrentByDisplayOrder =
                            (version.display_order ||
                              version.version_number) === maxDisplayOrder;
                          const isCurrent =
                            isCurrentByDisplayOrder ||
                            version.is_current_version;

                          return (
                            isCurrent && (
                              <Badge
                                variant="default"
                                className="text-xs px-1 py-0"
                              >
                                <Star className="h-2 w-2 mr-1" />
                                Current
                              </Badge>
                            )
                          );
                        })()}
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/media/${version.id}`, "_blank");
                        }}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                      {!version.is_current_version ||
                      !version.parent_media_id ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (!version.parent_media_id) {
                              handleDeleteParentMedia(version.id);
                            } else {
                              handleDeleteVersion(version.id);
                            }
                          }}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-400">
                      <span>{formatFileSize(version.file_size)}</span>
                    </div>

                    {/* Mobile Arrow controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(version.id, index)}
                        disabled={!canMoveUp}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(version.id, index)}
                        disabled={!canMoveDown}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (>= 640px) - Now matches mobile layout structure */}
            <div className="hidden sm:block">
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="relative w-14 h-10 bg-secondary border-2 border-black/20 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {(() => {
                    const category = getFileCategory(
                      version.file_type,
                      version.mime_type
                    );

                    switch (category) {
                      case "image":
                        return (
                          <img
                            src={version.r2_url}
                            alt={version.original_filename}
                            className="w-full h-full object-cover"
                          />
                        );

                      case "video":
                        return version.thumbnail_r2_url ? (
                          <img
                            src={version.thumbnail_r2_url}
                            alt={`${version.original_filename} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <VideoCameraIcon className="h-5 w-5 text-white/80" />
                          </div>
                        );

                      case "audio":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-500 to-blue-800">
                            <MusicalNoteIcon className="h-5 w-5 text-white/80" />
                          </div>
                        );

                      case "svg":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-green-600 to-teal-800">
                            <CodeBracketIcon className="h-5 w-5 text-white/80" />
                          </div>
                        );

                      case "document":
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <DocumentIcon className="h-5 w-5 text-white/80" />
                          </div>
                        );

                      default:
                        return (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-600 to-gray-800">
                            <DocumentIcon className="h-5 w-5 text-white/80" />
                          </div>
                        );
                    }
                  })()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-medium text-white text-sm leading-tight truncate"
                        title={version.original_filename}
                      >
                        {truncateFilename(version.original_filename, "tablet")}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          v{displayVersionNumber}
                        </Badge>
                        {(() => {
                          const maxDisplayOrder = Math.max(
                            ...uniqueVersions.map(
                              (v) => v.display_order || v.version_number
                            )
                          );
                          const isCurrentByDisplayOrder =
                            (version.display_order ||
                              version.version_number) === maxDisplayOrder;
                          const isCurrent =
                            isCurrentByDisplayOrder ||
                            version.is_current_version;

                          return (
                            isCurrent && (
                              <Badge
                                variant="default"
                                className="text-xs px-2 py-0.5"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )
                          );
                        })()}
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/media/${version.id}`, "_blank");
                        }}
                        title="View media"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {!version.is_current_version ||
                      !version.parent_media_id ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            if (!version.parent_media_id) {
                              handleDeleteParentMedia(version.id);
                            } else {
                              handleDeleteVersion(version.id);
                            }
                          }}
                          title="Delete version"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatFileSize(version.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(version.uploaded_at)}</span>
                    </div>

                    {/* Desktop Arrow controls - Now positioned like mobile */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveUp(version.id, index)}
                        disabled={!canMoveUp}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveDown(version.id, index)}
                        disabled={!canMoveDown}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
