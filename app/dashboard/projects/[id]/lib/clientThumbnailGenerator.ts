// lib/clientThumbnailGenerator.ts
export async function generateVideoThumbnailFromFile(
  videoFile: File
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("❌ Failed to get canvas context");
      resolve(null);
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      // Calculate optimal thumbnail dimensions based on video quality
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoAspect = videoWidth / videoHeight;

      let thumbnailWidth, thumbnailHeight;

      // Determine thumbnail size based on video resolution
      if (videoWidth >= 3840 || videoHeight >= 2160) {
        // 4K and above - downscale to 1920x1080 maintaining aspect ratio
        if (videoAspect >= 16 / 9) {
          thumbnailWidth = 1920;
          thumbnailHeight = Math.round(1920 / videoAspect);
        } else {
          thumbnailHeight = 1080;
          thumbnailWidth = Math.round(1080 * videoAspect);
        }
      } else if (videoWidth >= 1920 || videoHeight >= 1080) {
        // 1080p - keep original size
        thumbnailWidth = videoWidth;
        thumbnailHeight = videoHeight;
      } else if (videoWidth >= 1280 || videoHeight >= 720) {
        // 720p - keep original size
        thumbnailWidth = videoWidth;
        thumbnailHeight = videoHeight;
      } else {
        // Lower quality - upscale to 720p maintaining aspect ratio
        if (videoAspect >= 16 / 9) {
          thumbnailWidth = 1280;
          thumbnailHeight = Math.round(1280 / videoAspect);
        } else {
          thumbnailHeight = 720;
          thumbnailWidth = Math.round(720 * videoAspect);
        }
      }

      // Set canvas to the calculated dimensions
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;

      // Seek to 2 seconds or 30% of video duration, whichever is smaller
      const seekTime = Math.min(2, video.duration * 0.3);

      video.currentTime = seekTime;
    });

    video.addEventListener("seeked", () => {
      try {
        // Draw the video frame to fill the entire canvas (no black bars)
        // This maintains the exact aspect ratio of the original video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob with high quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
            } else {
              console.error("❌ Failed to generate blob from canvas");
            }
            URL.revokeObjectURL(video.src);
            resolve(blob);
          },
          "image/jpeg",
          0.85 // Higher quality for better thumbnails
        );
      } catch (error) {
        console.error("❌ Error drawing video frame:", error);
        URL.revokeObjectURL(video.src);
        resolve(null);
      }
    });

    video.addEventListener("error", (e) => {
      console.error("❌ Video loading error:", e);
      URL.revokeObjectURL(video.src);
      resolve(null);
    });

    // Load video
    video.src = URL.createObjectURL(videoFile);

    video.load();
  });
}
