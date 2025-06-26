// aa/app/dashboard/projects/[id]/components/reviews_Dialogs/VersionManagerDialog.tsx

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VersionDragList } from "./VersionDragList";
import { MediaFile, OrganizedMedia } from "@/app/dashboard/lib/types";


interface VersionManagerDialogState {
  open: boolean;
  media?: OrganizedMedia;
  isUpdating: boolean;
}

interface VersionManagerDialogProps {
  versionManagerDialog: VersionManagerDialogState;
  onVersionManagerDialogChange: (dialog: VersionManagerDialogState) => void;
  projectId: string;
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
}

export function VersionManagerDialog({
  versionManagerDialog,
  onVersionManagerDialogChange,
  projectId,
  onMediaUpdated,
}: VersionManagerDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getAllVersionsOrdered = (media: OrganizedMedia) => {
    const versionMap = new Map();

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
      parent_media_id: media.parent_media_id,
    };

    if (!parent.parent_media_id) {
      versionMap.set(parent.id, parent);
    }

    (media.versions || []).forEach((version) => {
      if (version && version.id) {
        versionMap.set(version.id, version);
      }
    });

    if (media.currentVersion && media.currentVersion.id) {
      versionMap.set(media.currentVersion.id, media.currentVersion);
    }

    const allVersions = Array.from(versionMap.values());

    return allVersions.sort((a, b) => {
      if (a.is_current_version && !b.is_current_version) return -1;
      if (!a.is_current_version && b.is_current_version) return 1;
      return b.version_number - a.version_number;
    });
  };

  return (
    <Dialog
      open={versionManagerDialog.open}
      onOpenChange={(open) =>
        onVersionManagerDialogChange({
          open,
          isUpdating: false,
        })
      }
    >
      <DialogContent className="max-w-2xl bg-primary-foreground">
        <DialogHeader>
          <DialogTitle>Manage Versions</DialogTitle>
        </DialogHeader>

        {versionManagerDialog.media && (
          <div className="space-y-4">
            <VersionDragList
              versions={getAllVersionsOrdered(versionManagerDialog.media)}
              onReorder={(reorderedVersions) => {
                const updatedMedia = {
                  ...versionManagerDialog.media!,
                  versions: reorderedVersions.slice(1),
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
              }}
              onDeleteVersion={(versionId, updatedVersions) => {
                const updatedMedia = {
                  ...versionManagerDialog.media!,
                  versions: updatedVersions.slice(1),
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
              }}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
              projectId={projectId}
              onMediaUpdated={onMediaUpdated}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
