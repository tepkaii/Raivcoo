// app/review/[token]/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

import { PasswordProtectedReview } from "./review_components/PasswordProtectedReview";
import { Metadata } from "next";
import { MediaInterface } from "./MediaInterface";

// Dynamic metadata - keep existing code...
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { token } = await params;

  // Get review link with media filename
  const { data: reviewLink, error: linkError } = await supabase
    .from("review_links")
    .select(
      `
      id,
      title,
      is_active,
      expires_at,
      media:project_media (
        original_filename,
        file_type
      )
    `
    )
    .eq("link_token", token)
    .eq("is_active", true)
    .single();

  if (linkError || !reviewLink) {
    return {
      title: "Review Not Found",
      description: "The requested review link could not be found.",
    };
  }

  // Check if expired
  if (reviewLink.expires_at && new Date(reviewLink.expires_at) < new Date()) {
    return {
      title: "Review Link Expired",
      description: "This review link has expired and is no longer available.",
    };
  }

  // Use media filename for better UX
  const mediaName = reviewLink.media?.original_filename || "Media";
  const title = reviewLink.title || `${mediaName} - Review`;
  const description = `Review and provide feedback on ${mediaName}`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: title,
      description: description,
    },
    robots: {
      index: false, // Don't index review links for privacy
      follow: false,
    },
  };
}

// Review page
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ authenticated?: string }>;
}) {
  const supabase = await createClient();
  const { token } = await params;
  const search = await searchParams;

  // Get current user if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile data if user is authenticated
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("editor_profiles")
      .select("full_name, display_name, email, avatar_url")
      .eq("user_id", user.id)
      .single();

    userProfile = profile;
  }

  // ✅ UPDATED: Get review link with download permission included
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
        allow_download,
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
          is_current_version,
          version_name,
          status
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

  // Get all versions if this media has versions and determine current media to show
  let allVersions: any[] = [];
  let currentMediaToShow = reviewLink.media;

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
          is_current_version,
          version_name,
          status
        `
      )
      .or(`id.eq.${mediaId},parent_media_id.eq.${mediaId}`)
      .order("version_number", { ascending: false });

    allVersions = versions || [];

    // Find the current version to show by default
    const currentVersion = allVersions.find((v) => v.is_current_version);
    if (currentVersion) {
      currentMediaToShow = currentVersion;
    } else {
      // Fallback to the highest version number if no current version is marked
      currentMediaToShow = allVersions[0] || reviewLink.media;
    }
  }

  return (
    <MediaInterface
      media={currentMediaToShow}
      allVersions={allVersions}
      reviewTitle={reviewLink.title}
      projectName={reviewLink.project?.name}
      allowDownload={reviewLink.allow_download ?? false} // ✅ PASS DOWNLOAD PERMISSION - Default to false for security
      authenticatedUser={
        user && userProfile
          ? {
              id: user.id,
              email: userProfile.email || user.email || "",
              name:
                userProfile.display_name ||
                userProfile.full_name ||
                user.email ||
                "",
              avatar_url: userProfile.avatar_url || null,
            }
          : null
      }
    />
  );
}