// app/media/full-size/[id]/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { FullsizeVideoViewer } from "./FullsizeVideoViewer";
import { Metadata } from "next";

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  // Get the media file by ID for metadata
  const { data: mediaFile, error } = await supabase
    .from("project_media")
    .select(
      `
      id,
      original_filename,
      file_type,
      mime_type,
      project_id
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

  const isVideo = mediaFile.file_type === "video";
  const mediaType = isVideo ? "Video" : "Image";

  return {
    title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
    description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
    openGraph: {
      title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
      description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
      type: isVideo ? "video.other" : "website",
      ...(isVideo && {
        videos: [
          {
            url: mediaFile.r2_url || "",
            type: mediaFile.mime_type,
          },
        ],
      }),
      ...(mediaFile.file_type === "image" && {
        images: [
          {
            url: mediaFile.r2_url || "",
            alt: mediaFile.original_filename,
          },
        ],
      }),
    },
    twitter: {
      card: isVideo ? "player" : "summary_large_image",
      title: `${mediaFile.original_filename} - ${mediaType} Viewer`,
      description: `View ${mediaFile.original_filename} in fullsize ${mediaType.toLowerCase()} viewer`,
      ...(isVideo && {
        player: {
          url: mediaFile.r2_url || "",
          width: 1280,
          height: 720,
        },
      }),
      ...(mediaFile.file_type === "image" && {
        images: [mediaFile.r2_url || ""],
      }),
    },
  };
}

export default async function FullsizeVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Get the media file by ID
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
      project_id
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
