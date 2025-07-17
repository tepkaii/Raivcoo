// app/dashboard/projects/[id]/folders/components/DeleteFolderDialog.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ProjectFolder } from "@/app/dashboard/lib/types";
import { deleteFolderAction } from "../../lib/FolderActions";
import { toast } from "@/hooks/use-toast";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ProjectFolder;
  projectId: string;
  onFolderDeleted: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  projectId,
  onFolderDeleted,
}: DeleteFolderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteFolderAction(projectId, folder.id);

      if (result.success) {
        onFolderDeleted();
        toast({
          title: "Folder Deleted",
          description: `"${folder.name}" has been deleted successfully`,
          variant: "destructive",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to Delete Folder",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{folder.name}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This folder must be empty before it can be deleted. Move or delete
            all files and subfolders first.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Folder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
