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

    try {
      const result = await deleteMediaAction(projectId, mediaFile.id);

      if (result.success) {
        // ✅ COMPLETE THE DELETE LOGIC - This was missing!
        const deletedMediaId = mediaFile.id;
        const parentId = mediaFile.parent_media_id || mediaFile.id;

        // Get all media in this group (parent + all versions)
        const mediaGroup = mediaFiles.filter(
          (file) => file.id === parentId || file.parent_media_id === parentId
        );

        // Filter out the deleted media from the entire mediaFiles array
        let updatedMediaFiles = mediaFiles.filter((file) => {
          // Remove the specific deleted file
          if (file.id === deletedMediaId) return false;

          // If we deleted the parent and there are no other versions, remove everything
          if (!mediaFile.parent_media_id && mediaGroup.length === 1) {
            return file.id !== parentId && file.parent_media_id !== parentId;
          }

          return true;
        });

        // If we deleted a version (not parent), check if we need to update current version
        if (mediaFile.parent_media_id && mediaFile.is_current_version) {
          // Find remaining versions and set the highest version as current
          const remainingVersions = updatedMediaFiles.filter(
            (file) => file.parent_media_id === parentId || file.id === parentId
          );

          if (remainingVersions.length > 0) {
            // Sort by version number and set highest as current
            const sortedVersions = remainingVersions.sort(
              (a, b) => b.version_number - a.version_number
            );
            const newCurrentVersion = sortedVersions[0];

            updatedMediaFiles = updatedMediaFiles.map((file) => {
              if (file.id === newCurrentVersion.id) {
                return { ...file, is_current_version: true };
              } else if (
                file.parent_media_id === parentId ||
                file.id === parentId
              ) {
                return { ...file, is_current_version: false };
              }
              return file;
            });
          }
        }

        // ✅ UPDATE THE STATE - This was the missing piece!
        onMediaUpdated(updatedMediaFiles);

        // ✅ UPDATE REVIEW LINKS if needed
        const updatedReviewLinks = reviewLinks.filter(
          (link) => link.media_id !== deletedMediaId
        );
        onReviewLinksUpdated(updatedReviewLinks);

        toast({
          title: "Media Deleted",
          description: "Media has been deleted successfully",
          variant: "green",
        });

        setDeleteDialog({ open: false, isDeleting: false });
      } else {
        throw new Error(result.error || "Failed to delete media");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteDialog((prev: any) => ({ ...prev, isDeleting: false }));
      toast({
        title: "Failed to Delete Media",
        description:
          error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    mediaFile: MediaFile,
    newStatus: string
  ) => {
    try {
      const result = await updateMediaStatusAction(mediaFile.id, newStatus);

      if (result.success) {
        const updatedFiles = mediaFiles.map((file) =>
          file.id === mediaFile.id ? { ...file, status: newStatus } : file
        );
        onMediaUpdated(updatedFiles);

        toast({
          title: "Status Updated",
          description: `Media status changed to ${newStatus.replace("_", " ")}`,
          variant: "default",
        });
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: "Failed to Update Status",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return {
    handleDeleteMedia,
    handleStatusChange,
  };
};