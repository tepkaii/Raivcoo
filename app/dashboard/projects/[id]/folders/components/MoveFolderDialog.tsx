// app/dashboard/projects/[id]/folders/components/MoveFolderDialog.tsx
// @ts-nocheck
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { FolderIcon, HomeIcon } from "@heroicons/react/24/solid";
import { ProjectFolder } from "@/app/dashboard/types";
import { moveFolderAction } from "../../lib/FolderActions";

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ProjectFolder;
  allFolders: ProjectFolder[];
  projectId: string;
  onMoveComplete: (updatedFolders: ProjectFolder[]) => void;
}

export function MoveFolderDialog({
  open,
  onOpenChange,
  folder,
  allFolders,
  projectId,
  onMoveComplete,
}: MoveFolderDialogProps) {
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

  // Check if a folder is a descendant of another folder
  const isDescendantOf = (
    ancestorId: string,
    potentialDescendantId: string
  ): boolean => {
    const potentialDescendant = allFolders.find(
      (f) => f.id === potentialDescendantId
    );
    if (!potentialDescendant || !potentialDescendant.parent_folder_id)
      return false;

    if (potentialDescendant.parent_folder_id === ancestorId) return true;
    return isDescendantOf(ancestorId, potentialDescendant.parent_folder_id);
  };

  // Get valid destination folders (exclude the folder being moved and its descendants)
  const getValidDestinations = () => {
    const destinations = [
      { id: "root", name: "Project Root", path: "Project Root" },
    ];

    allFolders.forEach((f) => {
      // Skip the folder being moved and its descendants
      if (f.id === folder.id || isDescendantOf(folder.id, f.id)) {
        return;
      }

      destinations.push({
        id: f.id,
        name: f.name,
        path: getFolderPath(f.id),
      });
    });

    return destinations.sort((a, b) => a.path.localeCompare(b.path));
  };

  const validDestinations = getValidDestinations();

  // Get current folder path
  const currentPath = getFolderPath(folder.parent_folder_id);

  // Get selected destination info
  const selectedDestination = selectedTarget
    ? validDestinations.find((d) => d.id === selectedTarget)
    : null;

  // Check if selection is different from current location
  const hasValidSelection =
    selectedTarget &&
    ((selectedTarget === "root" && folder.parent_folder_id !== null) ||
      (selectedTarget !== "root" &&
        selectedTarget !== folder.parent_folder_id));

  const handleSave = async () => {
    if (!hasValidSelection) return;

    setIsLoading(true);

    try {
      const targetId = selectedTarget === "root" ? null : selectedTarget;

      const result = await moveFolderAction(projectId, folder.id, targetId);

      if (result.success) {
        const destinationName = selectedDestination?.name || "Project Root";

        toast({
          title: "Success",
          description: `Successfully moved "${folder.name}" to ${destinationName}`,
        });

        // Update the folders with the new structure
        const updatedFolders = allFolders.map((f) =>
          f.id === folder.id ? { ...f, parent_folder_id: targetId } : f
        );

        onMoveComplete(updatedFolders);
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to move folder",
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
          <DialogTitle>Move Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Current Location
            </Label>
            <div className="flex items-center text-base gap-2 px-2 py-1 bg-muted/50 rounded-full">
              <FolderIcon
                className="h-4 w-4 flex-shrink-0"
                style={{ color: folder.color }}
              />
              <span>
                {currentPath} / {folder.name}
              </span>
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
                <FolderIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: folder.color }}
                />
                <span className="text-base">
                  {selectedDestination.id === "root"
                    ? "Project Root"
                    : `${selectedDestination.path} / ${folder.name}`}{" "}
                  / {folder.name}
                </span>
              </div>
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
            {isLoading ? "Moving..." : "Move Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
