// @ts-nocheck
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/app/dashboard/lib/types";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
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
    <div className="space-y-2">
      {uniqueVersions.map((version, index) => {
        if (!version || !version.id || !version.file_type) {
          return null;
        }

        // ✅ Show original version_number (historical), not display_order
        const displayVersionNumber = version.version_number;
        const canMoveUp = index > 0;
        const canMoveDown = index < uniqueVersions.length - 1;

        return (
          <Card key={version.id} className="p-4">
            <div className="flex items-center gap-4">
              {/* Arrow controls */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMoveUp(version.id, index)}
                  disabled={!canMoveUp}
                  title="Move up in list (doesn't change version number)"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMoveDown(version.id, index)}
                  disabled={!canMoveDown}
                  title="Move down in list (doesn't change version number)"
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
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white text-sm">
                  {version.original_filename}
                </h4>{" "}
                <p>Version {displayVersionNumber}</p>
                {(() => {
                  // ✅ Check BOTH display_order (primary) and is_current_version (backup)
                  const maxDisplayOrder = Math.max(
                    ...uniqueVersions.map(
                      (v) => v.display_order || v.version_number
                    )
                  );
                  const isCurrentByDisplayOrder =
                    (version.display_order || version.version_number) ===
                    maxDisplayOrder;
                  const isCurrentByFlag = version.is_current_version;

                  // Use display_order as primary, is_current_version as backup
                  const isCurrent =
                    isCurrentByDisplayOrder ||
                    (isCurrentByFlag &&
                      maxDisplayOrder ===
                        (version.display_order || version.version_number));

                  return (
                    isCurrent && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )
                  );
                })()}
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
                {!version.is_current_version || !version.parent_media_id ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!version.parent_media_id) {
                        handleDeleteParentMedia(version.id);
                      } else {
                        handleDeleteVersion(version.id);
                      }
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
