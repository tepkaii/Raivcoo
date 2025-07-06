// aa/app/dashboard/projects/[id]/components/reviews_Dialogs/VersionDragList.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Star, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/app/dashboard/lib/types";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/solid";

interface VersionDragListProps {
  versions: MediaFile[];
  onReorder: (reorderedVersions: MediaFile[]) => void;
  onDeleteVersion: (versionId: string, updatedVersions: MediaFile[]) => void;
  formatDate: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
  projectId: string;
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
}

export function VersionDragList({
  versions,
  onReorder,
  onDeleteVersion,
  formatDate,
  formatFileSize,
  projectId,
  onMediaUpdated,
}: VersionDragListProps) {
  // Remove duplicates by ID and sort by current version order
  const uniqueVersions = React.useMemo(() => {
    const versionMap = new Map();

    // Collect unique versions
    (versions || []).forEach((v) => {
      if (v && v.id && v.file_type) {
        versionMap.set(v.id, v);
      }
    });

    const uniqueVersions = Array.from(versionMap.values());

    // Sort by version number (highest first), with current version always first
    return uniqueVersions.sort((a, b) => {
      // Current version always comes first
      if (a.is_current_version && !b.is_current_version) return -1;
      if (!a.is_current_version && b.is_current_version) return 1;

      // Otherwise sort by version number (highest first)
      return b.version_number - a.version_number;
    });
  }, [versions]);

  const handleMoveUp = async (versionId: string, currentIndex: number) => {
    if (currentIndex === 0) return; // Already at top

    const newVersions = [...uniqueVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex - 1, 0, movedItem);

    // Recalculate version numbers based on new positions
    const reorderedVersions = newVersions.map((version, index) => ({
      ...version,
      version_number: newVersions.length - index,
      is_current_version: index === 0,
    }));

    await updateVersionsInDatabase(reorderedVersions);
  };

  const handleMoveDown = async (versionId: string, currentIndex: number) => {
    if (currentIndex === uniqueVersions.length - 1) return; // Already at bottom

    const newVersions = [...uniqueVersions];
    const [movedItem] = newVersions.splice(currentIndex, 1);
    newVersions.splice(currentIndex + 1, 0, movedItem);

    // Recalculate version numbers based on new positions
    const reorderedVersions = newVersions.map((version, index) => ({
      ...version,
      version_number: newVersions.length - index,
      is_current_version: index === 0,
    }));

    await updateVersionsInDatabase(reorderedVersions);
  };

  const handleDeleteVersion = async (versionId: string) => {
    const remainingVersions = uniqueVersions.filter((v) => v.id !== versionId);

    // Renumber remaining versions
    const reorderedVersions = remainingVersions.map((version, index) => ({
      ...version,
      version_number: remainingVersions.length - index,
      is_current_version: index === 0,
    }));

    try {
      const supabase = createClient();

      // Delete the version
      await supabase.from("project_media").delete().eq("id", versionId);

      // Update remaining versions with new numbers
      if (reorderedVersions.length > 0) {
        for (const version of reorderedVersions) {
          await supabase
            .from("project_media")
            .update({
              version_number: version.version_number,
              is_current_version: version.is_current_version,
            })
            .eq("id", version.id);
        }
      }

      // Update UI immediately
      onDeleteVersion(versionId, reorderedVersions);

      // Refresh all media for the project
      await refreshProjectMedia();
    } catch (error) {
      console.error("Failed to delete version:", error);
    }
  };

  // Centralized function to update versions in database
  const updateVersionsInDatabase = async (reorderedVersions: MediaFile[]) => {
    try {
      const supabase = createClient();

      // Update each version one by one to avoid conflicts
      for (const version of reorderedVersions) {
        await supabase
          .from("project_media")
          .update({
            version_number: version.version_number,
            is_current_version: version.is_current_version,
          })
          .eq("id", version.id);
      }

      // Update UI immediately
      onReorder(reorderedVersions);

      // Refresh all media for the project
      await refreshProjectMedia();
    } catch (error) {
      console.error("Failed to update versions:", error);
    }
  };

  // Centralized function to refresh project media
  const refreshProjectMedia = async () => {
    try {
      const supabase = createClient();
      const { data: updatedMediaFiles, error } = await supabase
        .from("project_media")
        .select("*")
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

  // Early return if no valid versions
  if (!uniqueVersions || uniqueVersions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No versions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2  ">
      {uniqueVersions.map((version, index) => {
        // Extra safety check for each version
        if (!version || !version.id || !version.file_type) {
          return null;
        }

        const displayVersionNumber = version.version_number;
        const canMoveUp = index > 0;
        const canMoveDown = index < uniqueVersions.length - 1;

        return (
          <Card key={version.id} className="p-4 ">
            <div className="flex items-center gap-4">
              {/* Arrow controls */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMoveUp(version.id, index)}
                  disabled={!canMoveUp}
                  title="Move up (increase version)"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMoveDown(version.id, index)}
                  disabled={!canMoveDown}
                  title="Move down (decrease version)"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Thumbnail */}
              <div className="relative w-16 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
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
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Version {displayVersionNumber}</p>
                  <p>{formatDate(version.uploaded_at)}</p>
                  <p>{formatFileSize(version.file_size)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/media/full-size/${version.id}`, "_blank");
                  }}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
                {!version.is_current_version && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVersion(version.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
