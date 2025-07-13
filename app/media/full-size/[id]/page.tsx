// app/media/full-size/[id]/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { FullsizeVideoViewer } from "./FullsizeVideoViewer";
import { Metadata } from "next";

// ✅ ADD FILE CATEGORY HELPER
const getFileCategory = (fileType: string, mimeType: string) => {
  if (fileType === "video") return "video";
  if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || 
      mimeType.includes("document") || 
      mimeType.includes("presentation") ||
      mimeType === "text/plain") return "document";
  return "unknown";
};

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  // Get the media file by ID for metadata - ✅ INCLUDE THUMBNAIL FIELDS
  const { data: mediaFile, error } = await supabase
    .from("project_media")
    .select(
      `
      id,
      original_filename,
      file_type,
      mime_type,
      r2_url,
      project_id,
      thumbnail_r2_url,
      thumbnail_r2_key
    `
    )
    .eq("id", id)
    .single();

  if (error || !mediaFile) {
    return {
      title: "Media Not Found",
      description: "The requested media file could not be found.",
    };
  }

  // ✅ DETERMINE FILE CATEGORY AND MEDIA TYPE
  const fileCategory = getFileCategory(mediaFile.file_type, mediaFile.mime_type);
  const mediaType = (() => {
    switch (fileCategory) {
      case "video": return "Video";
      case "audio": return "Audio";
      case "image": return "Image";
      case "document": return "Document";
      case "svg": return "SVG";
      default: return "Media";
    }
  })();

  // ✅ GET IMAGE URL - ONLY FOR IMAGES AND VIDEOS WITH THUMBNAILS
  const getImageUrl = () => {
    // For images: use thumbnail if available, fallback to original image
    if (fileCategory === "image") {
      if (mediaFile.thumbnail_r2_url && mediaFile.thumbnail_r2_url.trim() !== '') {
        return mediaFile.thumbnail_r2_url;
      }
      return mediaFile.r2_url; // Original image
    }
    
    // For videos: ONLY use thumbnail if available, no fallback
    if (fileCategory === "video") {
      if (mediaFile.thumbnail_r2_url && mediaFile.thumbnail_r2_url.trim() !== '') {
        return mediaFile.thumbnail_r2_url;
      }
      return null; // No image for videos without thumbnails
    }

    // For all other file types: no image
    return null;
  };

  const imageUrl = getImageUrl();

  // ✅ BASE METADATA - ALWAYS PRESENT
  const baseMetadata = {
    title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
    description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
    openGraph: {
      title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
      description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
      type: fileCategory === "video" ? "video.other" : "website",
      // ✅ ADD VIDEO METADATA FOR ALL VIDEOS
      ...(fileCategory === "video" && {
        videos: [
          {
            url: mediaFile.r2_url || "",
            type: mediaFile.mime_type,
          },
        ],
      }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
      description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
      // ✅ ADD VIDEO PLAYER FOR ALL VIDEOS
      ...(fileCategory === "video" && {
        player: {
          url: mediaFile.r2_url || "",
          width: 1280,
          height: 720,
        },
      }),
    },
  };

  // ✅ ADD IMAGES ONLY IF WE HAVE A VALID IMAGE URL
  if (imageUrl) {
    baseMetadata.openGraph.images = [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: fileCategory === "image" 
          ? mediaFile.original_filename 
          : `${mediaFile.original_filename} - ${mediaType}`,
      },
    ];
    baseMetadata.twitter.images = [imageUrl];
  }

  return baseMetadata;
}

export default async function FullsizeMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Get the media file by ID - ✅ INCLUDE THUMBNAIL FIELDS
  const { data: mediaFile, error } = await supabase
    .from("project_media")
    .select(
      `
      id,
      filename,
      original_filename,
      file_type,
      mime_type,
      file_size,
      r2_url,
      uploaded_at,
      parent_media_id,
      version_number,
      is_current_version,
      version_name,
      project_id,
      thumbnail_r2_url,
      thumbnail_r2_key,
      thumbnail_generated_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !mediaFile) {
    return notFound();
  }

  // Optional: Add access control here if needed
  // You could check if the user has access to this project

  return <FullsizeVideoViewer mediaFile={mediaFile} />;
}