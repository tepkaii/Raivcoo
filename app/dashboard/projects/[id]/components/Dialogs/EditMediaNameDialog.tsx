// app/dashboard/projects/[id]/components/Dialogs/EditMediaNameDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MediaFile } from "@/app/dashboard/types";
import { updateMediaNameAction } from "../../lib/GeneralActions";

interface EditMediaNameDialogProps {
  editNameDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isUpdating: boolean;
  };
  onEditNameDialogChange: (dialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isUpdating: boolean;
  }) => void;
  projectId: string;
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
}

export function EditMediaNameDialog({
  editNameDialog,
  onEditNameDialogChange,
  projectId,
  onMediaUpdated,
}: EditMediaNameDialogProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (editNameDialog.open && editNameDialog.mediaFile) {
      setNewName(editNameDialog.mediaFile.original_filename);
      setError("");
    }
  }, [editNameDialog.open, editNameDialog.mediaFile]);

  const handleClose = () => {
    if (!editNameDialog.isUpdating) {
      onEditNameDialogChange({
        open: false,
        mediaFile: undefined,
        isUpdating: false,
      });
      setNewName("");
      setError("");
    }
  };

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Media name cannot be empty";
    }

    if (trimmedName.length > 255) {
      return "Media name is too long (maximum 255 characters)";
    }

    // Check for invalid characters that might cause issues
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      return "Media name contains invalid characters";
    }

    return null;
  };

  const handleSave = async () => {
    if (!editNameDialog.mediaFile) return;

    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedName = newName.trim();

    // Check if name actually changed
    if (trimmedName === editNameDialog.mediaFile.original_filename) {
      handleClose();
      return;
    }

    onEditNameDialogChange({
      ...editNameDialog,
      isUpdating: true,
    });

    try {
      // Use the action for permission checks and database update
      const result = await updateMediaNameAction(
        projectId,
        editNameDialog.mediaFile.id,
        trimmedName
      );

      if (result.success) {
        // ✅ Update local state immediately with the new name
        const updatedMediaFile: MediaFile = {
          ...editNameDialog.mediaFile,
          original_filename: trimmedName,
        };

        // Update the local state with just this one file
        onMediaUpdated([updatedMediaFile]);

        toast({
          title: "Success",
          description: "Media name updated successfully",
          variant: "green",
        });

        // Close the dialog
        handleClose();
      } else {
        setError(result.error || "Failed to update media name");
        onEditNameDialogChange({
          ...editNameDialog,
          isUpdating: false,
        });
      }
    } catch (error) {
      console.error("Error updating media name:", error);
      setError("An unexpected error occurred");
      onEditNameDialogChange({
        ...editNameDialog,
        isUpdating: false,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    if (error) {
      setError(""); // Clear error when user starts typing
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  // Get the display name and version info
  const displayInfo = editNameDialog.mediaFile
    ? {
        currentName: editNameDialog.mediaFile.original_filename,
        fileType: editNameDialog.mediaFile.file_type,
        isVersion: !!editNameDialog.mediaFile.parent_media_id,
        versionNumber: editNameDialog.mediaFile.version_number,
      }
    : null;

  return (
    <Dialog open={editNameDialog.open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rename Media File
          </DialogTitle>
          <DialogDescription>
            Enter a new name for this media file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="media-name">Media Name</Label>
            <Input
              id="media-name"
              value={newName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter media name..."
              disabled={editNameDialog.isUpdating}
              className={
                error ? "border-destructive focus-visible:ring-destructive" : ""
              }
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {displayInfo && (
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Current name:</strong> {displayInfo.currentName}
              </p>
              <p>
                <strong>File type:</strong> {displayInfo.fileType}
              </p>
              {displayInfo.isVersion && (
                <p>
                  <strong>Version:</strong> {displayInfo.versionNumber}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={editNameDialog.isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={editNameDialog.isUpdating || !!error || !newName.trim()}
          >
            {editNameDialog.isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
