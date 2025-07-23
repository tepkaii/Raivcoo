// app/dashboard/projects/[id]/handlers/uploadHandlers.ts
import { toast } from "@/hooks/use-toast";
import { MediaFile } from "@/app/dashboard/types";
import { uploadFilesWithThumbnails } from "../lib/uploadWithThumbnails";
import { UploadValidator } from "../lib/UploadLogic";

export const createUploadHandlers = (
  projectId: string,
  currentFolderId: string | undefined,
  mediaFiles: MediaFile[],
  onMediaUpdated: (files: MediaFile[]) => void,
  setIsUploading: (loading: boolean) => void,
  setUploadProgress: (progress: number) => void,
  setDraggedOver: (id: string | null) => void,
  setDraggedMedia: (media: MediaFile | null) => void,
  setExpandedMedia: (updater: (prev: Set<string>) => Set<string>) => void
) => {
  const uploadFilesHandler = async (
    files: File[],
    targetMediaId?: string,
    uploadValidator?: UploadValidator
  ) => {
    if (!uploadValidator) {
      toast({
        title: "Upload Error",
        description:
          "Upload validator not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadValidator.canUploadFiles(files)) {
      uploadValidator.showUploadError(files);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadFilesWithThumbnails(
        files,
        projectId,
        targetMediaId,
        setUploadProgress,
        currentFolderId
      );

      if (response.ok) {
        const result = await response.json();

        if (result.files) {
          const newFiles = [...mediaFiles, ...result.files];
          onMediaUpdated(newFiles);

          if (targetMediaId) {
            setExpandedMedia((prev) => new Set(prev).add(targetMediaId));
          }

          toast({
            title: "Upload Complete",
            description: result.message,
            variant: "green",
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setDraggedOver(null);
      setDraggedMedia(null);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadValidator?: UploadValidator
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      uploadFilesHandler(files, undefined, uploadValidator);
    }
    event.target.value = "";
  };

  return {
    uploadFilesHandler,
    handleFileInputChange,
  };
};
