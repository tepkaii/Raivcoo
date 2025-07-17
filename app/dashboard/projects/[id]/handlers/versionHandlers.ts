// app/dashboard/projects/[id]/handlers/versionHandlers.ts
import { toast } from "@/hooks/use-toast";
import { MediaFile, OrganizedMedia } from "@/app/dashboard/lib/types";
import { createClient } from "@/utils/supabase/client";
import {
  reorderVersionsAction,
  updateVersionNameAction,
} from "../lib/GeneralActions";
import { deleteVersionAction } from "../lib/DeleteMediaActions";

export const createVersionHandlers = (
  mediaFiles: MediaFile[],
  onMediaUpdated: (files: MediaFile[]) => void,
  setExpandedMedia: (updater: (prev: Set<string>) => Set<string>) => void,
  versionManagerDialog: any,
  setVersionManagerDialog: (dialog: any) => void
) => {
  const handleVersionReorder = async (
    parentId: string,
    reorderedVersions: MediaFile[]
  ) => {
    const result = await reorderVersionsAction(parentId, reorderedVersions);

    if (result.success) {
      const updatedFiles = mediaFiles.map((file) => {
        const updatedVersion = reorderedVersions.find((v) => v.id === file.id);
        if (updatedVersion) {
          return {
            ...file,
            version_number: updatedVersion.version_number,
            is_current_version: updatedVersion.is_current_version,
          };
        }
        return file;
      });

      onMediaUpdated(updatedFiles);

      toast({
        title: "Versions Reordered",
        description: "Version order has been updated",
        variant: "cyan",
      });
    } else {
      toast({
        title: "Failed to Reorder Versions",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleCreateVersion = async (
    targetMediaId: string,
    sourceMediaId: string
  ) => {
    const originalMediaFiles = [...mediaFiles];

    try {
      const draggedMedia = mediaFiles.find((m) => m.id === sourceMediaId);
      if (!draggedMedia) {
        throw new Error("Source media not found");
      }

      const sourceParentId = draggedMedia.parent_media_id || draggedMedia.id;
      const sourceGroup = mediaFiles.filter(
        (m) => m.id === sourceParentId || m.parent_media_id === sourceParentId
      );

      const currentVersion = sourceGroup.find((m) => m.is_current_version);
      const mediaToMoveId = currentVersion?.id || sourceMediaId;
      const mediaToMove = mediaFiles.find((m) => m.id === mediaToMoveId);

      if (!mediaToMove) {
        throw new Error("Media to move not found");
      }

      const targetGroup = mediaFiles.filter(
        (m) => m.id === targetMediaId || m.parent_media_id === targetMediaId
      );

      const maxVersionInTarget = Math.max(
        ...targetGroup.map((m) => m.version_number)
      );
      const nextVersionNumber = maxVersionInTarget + 1;

      const optimisticFiles = mediaFiles.map((file) => {
        if (file.id === mediaToMoveId) {
          return {
            ...file,
            parent_media_id: targetMediaId,
            version_number: nextVersionNumber,
            display_order: nextVersionNumber,
            is_current_version: true,
          };
        }

        if (targetGroup.some((m) => m.id === file.id)) {
          return {
            ...file,
            is_current_version: false,
          };
        }

        if (
          mediaToMoveId !== sourceParentId &&
          sourceGroup.some((m) => m.id === file.id)
        ) {
          const remainingInSource = sourceGroup.filter(
            (m) => m.id !== mediaToMoveId
          );

          if (remainingInSource.length > 0) {
            const newCurrentInSource = remainingInSource.reduce(
              (highest, current) =>
                current.version_number > highest.version_number
                  ? current
                  : highest
            );

            if (file.id === newCurrentInSource.id) {
              return {
                ...file,
                is_current_version: true,
              };
            } else {
              return {
                ...file,
                is_current_version: false,
              };
            }
          }
        }

        return file;
      });

      onMediaUpdated(optimisticFiles);
      setExpandedMedia((prev) => new Set(prev).add(targetMediaId));

      const supabase = createClient();
      const updates = [];

      updates.push(
        supabase
          .from("project_media")
          .update({
            parent_media_id: targetMediaId,
            version_number: nextVersionNumber,
            is_current_version: true,
          })
          .eq("id", mediaToMoveId)
      );

      updates.push(
        supabase
          .from("project_media")
          .update({ is_current_version: false })
          .in(
            "id",
            targetGroup.map((m) => m.id)
          )
      );

      if (mediaToMoveId !== sourceParentId) {
        const remainingInSource = sourceGroup.filter(
          (m) => m.id !== mediaToMoveId
        );

        if (remainingInSource.length > 0) {
          const newCurrentInSource = remainingInSource.reduce(
            (highest, current) =>
              current.version_number > highest.version_number
                ? current
                : highest
          );

          updates.push(
            supabase
              .from("project_media")
              .update({ is_current_version: true })
              .eq("id", newCurrentInSource.id)
          );

          const otherVersionsInSource = remainingInSource.filter(
            (m) => m.id !== newCurrentInSource.id
          );

          if (otherVersionsInSource.length > 0) {
            updates.push(
              supabase
                .from("project_media")
                .update({ is_current_version: false })
                .in(
                  "id",
                  otherVersionsInSource.map((m) => m.id)
                )
            );
          }
        }
      }

      const results = await Promise.allSettled(updates);

      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        console.error("❌ Some updates failed:", failures);
        throw new Error(`${failures.length} database updates failed`);
      }

      const movedMediaName = mediaToMove.original_filename;
      const targetName = mediaFiles.find(
        (m) => m.id === targetMediaId
      )?.original_filename;

      toast({
        title: "Version Created",
        description: `"${movedMediaName}" is now version ${nextVersionNumber} of "${targetName}"`,
        variant: "green",
      });
    } catch (error) {
      console.error("❌ Error in handleCreateVersion:", error);

      onMediaUpdated(originalMediaFiles);
      setExpandedMedia((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetMediaId);
        return newSet;
      });

      toast({
        title: "Failed to Create Version",
        description:
          error instanceof Error ? error.message : "Database error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVersionName = async (versionId: string, name: string) => {
    const result = await updateVersionNameAction(versionId, name);

    if (result.success) {
      const updatedFiles = mediaFiles.map((file) =>
        file.id === versionId ? { ...file, version_name: name } : file
      );
      onMediaUpdated(updatedFiles);
    } else {
      toast({
        title: "Failed to Update Version Name",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    const result = await deleteVersionAction(versionId);

    if (result.success) {
      const deletedVersion = mediaFiles.find((f) => f.id === versionId);
      if (!deletedVersion) {
        toast({
          title: "Version Deleted",
          description: "Version has been deleted",
          variant: "destructive",
        });
        return;
      }

      const parentId = deletedVersion.parent_media_id;
      let updatedFiles = mediaFiles.filter((file) => file.id !== versionId);

      if (deletedVersion.is_current_version && parentId) {
        const remainingVersions = updatedFiles.filter(
          (f) => f.id === parentId || f.parent_media_id === parentId
        );

        if (remainingVersions.length > 0) {
          const newCurrentVersion = remainingVersions.sort(
            (a, b) => b.version_number - a.version_number
          )[0];

          updatedFiles = updatedFiles.map((file) => {
            if (file.id === newCurrentVersion.id) {
              return { ...file, is_current_version: true };
            }
            return file;
          });
        }
      }

      onMediaUpdated(updatedFiles);

      if (versionManagerDialog.open && versionManagerDialog.media) {
        const currentDialogParentId = versionManagerDialog.media.id;

        if (
          parentId === currentDialogParentId ||
          deletedVersion.id === currentDialogParentId
        ) {
          const newParentData = updatedFiles.find(
            (f) => f.id === currentDialogParentId
          );
          const newVersionsData = updatedFiles.filter(
            (f) => f.parent_media_id === currentDialogParentId
          );

          if (newParentData) {
            const currentVersionData =
              newVersionsData.find((v) => v.is_current_version) ||
              newParentData;

            const updatedDialogMedia = {
              ...versionManagerDialog.media,
              versions: newVersionsData,
              currentVersion: currentVersionData,
            };

            setVersionManagerDialog({
              open: true,
              media: updatedDialogMedia,
              isUpdating: false,
            });
          }
        }
      }

      toast({
        title: "Version Deleted",
        description: "Version has been deleted",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Failed to Delete Version",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleOpenVersionManager = (media: OrganizedMedia) => {
    setVersionManagerDialog({
      open: true,
      media,
      isUpdating: false,
    });
  };

  return {
    handleVersionReorder,
    handleCreateVersion,
    handleUpdateVersionName,
    handleDeleteVersion,
    handleOpenVersionManager,
  };
};
