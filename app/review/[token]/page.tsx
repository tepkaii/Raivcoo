import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { FrameIOInterface } from "./FrameIOInterface";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const supabase = await createClient();
  const { token } = await params;

  // Get review link with associated media and all its versions
  const { data: reviewLink, error: linkError } = await supabase
    .from("review_links")
    .select(
      `
      id,
      title,
      is_active,
      created_at,
      expires_at,
      media_id,
      project:projects (
        id,
        name,
        description
      ),
      media:project_media (
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
        is_current_version
      )
    `
    )
    .eq("link_token", token)
    .eq("is_active", true)
    .single();

  if (linkError || !reviewLink) {
    return notFound();
  }

  // Check if link has expired
  if (reviewLink.expires_at && new Date(reviewLink.expires_at) < new Date()) {
    return notFound();
  }

  // Get all versions if this media has versions
  let allVersions: any[] = [];
  if (reviewLink.media) {
    const mediaId = reviewLink.media.parent_media_id || reviewLink.media.id;

    const { data: versions } = await supabase
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
        is_current_version
      `
      )
      .or(`id.eq.${mediaId},parent_media_id.eq.${mediaId}`)
      .order("version_number", { ascending: false });

    allVersions = versions || [];
  }

  return (
    <FrameIOInterface media={reviewLink.media} allVersions={allVersions} />
  );
}
