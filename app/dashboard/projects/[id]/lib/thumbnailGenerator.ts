// lib/thumbnailGenerator.ts
import { getPublicUrl, uploadFileToR2 } from "@/lib/r2";
import ffmpeg from "fluent-ffmpeg";

export interface ThumbnailResult {
  r2_key: string;
  r2_url: string;
}

export async function generateVideoThumbnail(
  videoBuffer: Buffer,
  projectId: string,
  mediaId: string,
  originalFilename: string
): Promise<ThumbnailResult | null> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary buffer stream
      const bufferStream = require("stream").Readable.from(videoBuffer);

      // Generate thumbnail filename
      const thumbnailFilename = `${mediaId}_thumbnail.jpg`;
      const thumbnailR2Key = `projects/${projectId}/thumbnails/${thumbnailFilename}`;

      // Use ffmpeg to extract frame at 30% of video duration
      ffmpeg(bufferStream)
        .seekInput("30%") // Seek to 30% of video duration
        .frames(1) // Extract only 1 frame
        .format("image2") // Output as image
        .outputOptions([
          "-vf",
          "scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2", // Resize and pad to consistent size
          "-q:v",
          "2", // High quality JPEG
        ])
        .on("end", async () => {
          try {
            resolve({
              r2_key: thumbnailR2Key,
              r2_url: getPublicUrl(thumbnailR2Key),
            });
          } catch (uploadError) {
            console.error("Failed to upload thumbnail:", uploadError);
            resolve(null);
          }
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          resolve(null); // Don't fail upload if thumbnail generation fails
        })
        .pipe(require("stream").PassThrough())
        .on("data", async (chunk: Buffer) => {
          // Collect all chunks and upload when complete
          const chunks: Buffer[] = [];
          chunks.push(chunk);
        })
        .on("end", async () => {
          try {
            const thumbnailBuffer = Buffer.concat([]);
            await uploadFileToR2(thumbnailR2Key, thumbnailBuffer, "image/jpeg");
            resolve({
              r2_key: thumbnailR2Key,
              r2_url: getPublicUrl(thumbnailR2Key),
            });
          } catch (uploadError) {
            console.error("Failed to upload thumbnail:", uploadError);
            resolve(null);
          }
        });
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      resolve(null);
    }
  });
}

// Alternative implementation using canvas if ffmpeg is not available
export async function generateVideoThumbnailCanvas(
  videoFile: File
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      // Seek to 30% of video duration
      video.currentTime = video.duration * 0.3;
    });

    video.addEventListener("seeked", () => {
      // Set canvas size
      canvas.width = 320;
      canvas.height = 240;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.8
      );
    });

    video.addEventListener("error", () => resolve(null));

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}
