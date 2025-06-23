import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { FullsizeVideoViewer } from "./FullsizeVideoViewer";

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
