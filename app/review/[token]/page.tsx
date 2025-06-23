// app/review/[token]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { FrameIOInterface } from "./FrameIOInterface";
import { PasswordProtectedReview } from "./review_components/PasswordProtectedReview";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ authenticated?: string }>;
}) {
  const supabase = await createClient();
  const { token } = await params;
  const search = await searchParams;

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
      requires_password,
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-primary-foreground border rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Review Link Expired</h1>
          <p className="text-muted-foreground mb-4">
            This review link has expired and is no longer available for viewing.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Expired on: {new Date(reviewLink.expires_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please contact the sender for a new review link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle password protection
  if (reviewLink.requires_password && search?.authenticated !== "true") {
    return (
      <PasswordProtectedReview
        token={token}
        reviewTitle={reviewLink.title}
        projectName={reviewLink.project?.name}
      />
    );
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
    <FrameIOInterface
      media={reviewLink.media}
      allVersions={allVersions}
      reviewTitle={reviewLink.title}
      projectName={reviewLink.project?.name}
    />
  );
}