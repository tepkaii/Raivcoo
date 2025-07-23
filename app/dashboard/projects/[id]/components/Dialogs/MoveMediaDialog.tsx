// app/dashboard/projects/[id]/components/media/MoveMediaDialog.tsx
// @ts-nocheck
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  FolderIcon,
  HomeIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { ProjectFolder, MediaFile } from "@/app/dashboard/types";
import { cn } from "@/lib/utils";
import { moveMediaAction } from "../../lib/GeneralActions";

interface MoveMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaFile: MediaFile;
  allFolders: ProjectFolder[];
  projectId: string;
  onMoveComplete: (updatedMedia: MediaFile) => void;
}

export function MoveMediaDialog({
  open,
  onOpenChange,
  mediaFile,
  allFolders,
  projectId,
  onMoveComplete,
}: MoveMediaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  const { toast } = useToast();

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedTarget("");
    }
  }, [open]);

  // Get the full path for a folder
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return "Project Root";

    const path: string[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const currentFolder = allFolders.find((f) => f.id === currentId);
      if (!currentFolder) break;

      path.unshift(currentFolder.name);
      currentId = currentFolder.parent_folder_id;
    }

    return `Project Root / ${path.join(" / ")}`;
  };

  // Get valid destination folders
  const getValidDestinations = () => {
    const destinations = [
      { id: "root", name: "Project Root", path: "Project Root" },
    ];

    allFolders.forEach((f) => {
      destinations.push({
        id: f.id,
        name: f.name,
        path: getFolderPath(f.id),
      });
    });

    return destinations.sort((a, b) => a.path.localeCompare(b.path));
  };

  const validDestinations = getValidDestinations();

  // Get current location info
  const getCurrentLocation = () => {
    if (mediaFile.parent_media_id) {
      return {
        type: "version",
        description: `Version of another media file`,
        path: "Inside parent media as version",
      };
    } else if (mediaFile.folder_id) {
      const folder = allFolders.find((f) => f.id === mediaFile.folder_id);
      return {
        type: "folder",
        description: folder ? `In folder: ${folder.name}` : "In unknown folder",
        path: folder ? getFolderPath(folder.id) : "Unknown folder",
      };
    } else {
      return {
        type: "root",
        description: "In project root",
        path: "Project Root",
      };
    }
  };

  const currentLocation = getCurrentLocation();

  // Get selected destination info
  const selectedDestination = selectedTarget
    ? validDestinations.find((d) => d.id === selectedTarget)
    : null;

  // Check if selection is different from current location
  const hasValidSelection =
    selectedTarget &&
    ((selectedTarget === "root" &&
      (mediaFile.folder_id !== null || mediaFile.parent_media_id !== null)) ||
      (selectedTarget !== "root" && selectedTarget !== mediaFile.folder_id));

  const handleSave = async () => {
    if (!hasValidSelection) return;

    setIsLoading(true);

    try {
      const targetFolderId = selectedTarget === "root" ? null : selectedTarget;

      const result = await moveMediaAction(
        projectId,
        mediaFile.id,
        targetFolderId
      );

      if (result.success) {
        const destinationName = selectedDestination?.name || "Project Root";

        toast({
          title: "Success",
          description: `Successfully moved "${mediaFile.original_filename}" to ${destinationName}`,
        });

        // Update the media with the new folder location
        const updatedMedia = {
          ...mediaFile,
          folder_id: targetFolderId,
          parent_media_id: null, // Remove from parent media if it was a version
        };

        onMoveComplete(updatedMedia);
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to move media",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Move error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Media</DialogTitle>
          <DialogDescription>
            Move this media file to a different location in your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media File Info */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Media File</Label>
            <div className="flex items-center text-base gap-2 px-2 py-1 bg-muted/50 rounded-full border">
              <VideoCameraIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span className="truncate">{mediaFile.original_filename}</span>
            </div>
          </div>

          {/* Current Location */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Current Location
            </Label>
            <div className="flex items-center text-base gap-2 px-2 py-1 bg-muted/50 rounded-full border">
              {currentLocation.type === "version" ? (
                <VideoCameraIcon className="h-4 w-4 flex-shrink-0 text-orange-500" />
              ) : currentLocation.type === "folder" ? (
                <FolderIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{
                    color:
                      allFolders.find((f) => f.id === mediaFile.folder_id)
                        ?.color || "#6b7280",
                  }}
                />
              ) : (
                <HomeIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <span className="text-sm ">{currentLocation.path}</span>
              </div>
            </div>
          </div>

          {/* Destination Selector */}
          <div className="space-y-2">
            <Label htmlFor="destination">New Location</Label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination folder">
                  {selectedTarget
                    ? validDestinations.find((d) => d.id === selectedTarget)
                        ?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {validDestinations.map((destination) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    <div className="flex items-center gap-2">
                      {destination.id === "root" ? (
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FolderIcon
                          className="h-4 w-4"
                          style={{
                            color:
                              allFolders.find((f) => f.id === destination.id)
                                ?.color || "#6b7280",
                          }}
                        />
                      )}
                      <div className="flex flex-col">
                        <span>{destination.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {destination.path}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedDestination && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                New Location Preview
              </Label>
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-950/20 rounded-full border border-green-200 dark:border-green-800">
                <VideoCameraIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm">
                  {selectedDestination.path} / {mediaFile.original_filename}
                </span>
              </div>
            </div>
          )}

          {/* Warning for version files */}
          {mediaFile.parent_media_id && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This will remove the media from its
                parent and make it an independent file.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasValidSelection || isLoading}
          >
            {isLoading ? "Moving..." : "Move Media"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
