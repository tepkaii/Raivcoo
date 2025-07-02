
// app/dashboard/projects/[id]/components/reviews_Dialogs/DeleteMediaDialog.tsx
"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MediaFile } from "@/app/dashboard/lib/types";

interface DeleteDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  isDeleting: boolean;
}

interface DeleteMediaDialogProps {
  deleteDialog: DeleteDialogState;
  onDeleteDialogChange: (dialog: DeleteDialogState) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
}

export function DeleteMediaDialog({
  deleteDialog,
  onDeleteDialogChange,
  onDeleteMedia,
}: DeleteMediaDialogProps) {
  return (
    <AlertDialog
      open={deleteDialog.open}
      onOpenChange={(open) =>
        onDeleteDialogChange({
          open,
          isDeleting: false,
        })
      }
    >
      <AlertDialogContent >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Media File</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to delete "
            {deleteDialog.mediaFile?.original_filename}"? This action cannot be
            undone and will also disable all review links for this media.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteDialog.mediaFile && onDeleteMedia(deleteDialog.mediaFile)
            }
            disabled={deleteDialog.isDeleting}
            className="bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/80 border-2 border-black/20"
          >
            {deleteDialog.isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
