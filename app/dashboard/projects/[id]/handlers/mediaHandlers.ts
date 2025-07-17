// app/dashboard/projects/[id]/handlers/mediaHandlers.ts
import { toast } from "@/hooks/use-toast";
import { MediaFile, ReviewLink } from "@/app/dashboard/lib/types";
import { deleteMediaAction } from "../lib/DeleteMediaActions";
import { updateMediaStatusAction } from "../lib/GeneralActions";

export const createMediaHandlers = (
  projectId: string,
  mediaFiles: MediaFile[],
  reviewLinks: ReviewLink[],
  onMediaUpdated: (files: MediaFile[]) => void,
  onReviewLinksUpdated: (links: ReviewLink[]) => void,
  versionManagerDialog: any,
  setVersionManagerDialog: (dialog: any) => void,
  setDeleteDialog: (dialog: any) => void
) => {
  const handleDeleteMedia = async (mediaFile: MediaFile) => {
    setDeleteDialog((prev: any) => ({ ...prev, isDeleting: true }));

    const result = await deleteMediaAction(projectId, mediaFile.id);

    if (result.success) {
      // ... existing delete logic (keep the same logic from original)
      const deletedMediaId = mediaFile.id;
      const parentId = mediaFile.parent_media_id || mediaFile.id;
      const mediaGroup = mediaFiles.filter(
        (file) => file.id === parentId || file.parent_media_id === parentId
      );

      // ... rest of the delete logic

      toast({
        title: "Media Deleted",
        description: "Current version has been deleted",
        variant: "green",
      });

      setDeleteDialog({ open: false, isDeleting: false });
    } else {
      setDeleteDialog((prev: any) => ({ ...prev, isDeleting: false }));
      toast({
        title: "Failed to Delete Media",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    mediaFile: MediaFile,
    newStatus: string
  ) => {
    const result = await updateMediaStatusAction(mediaFile.id, newStatus);

    if (result.success) {
      const updatedFiles = mediaFiles.map((file) =>
        file.id === mediaFile.id ? { ...file, status: newStatus } : file
      );
      onMediaUpdated(updatedFiles);

      toast({
        title: "Status Updated",
        description: `Media status changed to ${newStatus.replace("_", " ")}`,
        variant: "teal",
      });
    } else {
      toast({
        title: "Failed to Update Status",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return {
    handleDeleteMedia,
    handleStatusChange,
  };
};
