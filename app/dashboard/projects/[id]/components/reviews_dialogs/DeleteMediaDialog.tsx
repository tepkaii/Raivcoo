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

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
}

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
      <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Media File</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Are you sure you want to delete "
            {deleteDialog.mediaFile?.original_filename}"? This action cannot be
            undone and will also disable all review links for this media.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteDialog.mediaFile && onDeleteMedia(deleteDialog.mediaFile)
            }
            disabled={deleteDialog.isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
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
