// lib/uploadWithThumbnails.ts
import { generateVideoThumbnailFromFile } from "./clientThumbnailGenerator";

export async function uploadFilesWithThumbnails(
  files: File[],
  projectId: string,
  parentMediaId?: string,
  onProgress?: (progress: number) => void,
  folderId?: string | null
) {
  const formData = new FormData();

  // Process each file and generate thumbnails for videos
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    formData.append("files", file);

    // Generate thumbnail for video files
    if (file.type.startsWith("video/")) {
      try {
        const thumbnailBlob = await generateVideoThumbnailFromFile(file);
        if (thumbnailBlob) {
          // Create a file from the blob with a specific name
          const thumbnailFile = new File(
            [thumbnailBlob],
            `${file.name}_thumbnail.jpg`,
            { type: "image/jpeg" }
          );
          formData.append("thumbnails", thumbnailFile);
          formData.append("thumbnailFor", file.name); // Associate thumbnail with original file
        }
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${file.name}:`, error);
        // Continue without thumbnail
      }
    }

    // Update progress
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 50)); // 50% for processing
    }
  }

  if (parentMediaId) {
    formData.append("parentMediaId", parentMediaId);
  }

  // Add folder ID if provided
  if (folderId) {
    formData.append("folderId", folderId);
  }

  // Upload to server
  const response = await fetch(`/api/projects/${projectId}/media`, {
    method: "POST",
    body: formData,
  });

  if (onProgress) {
    onProgress(100);
  }

  return response;
}