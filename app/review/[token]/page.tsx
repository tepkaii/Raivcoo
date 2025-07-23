// app/review/[token]/page.tsx - USING RPC FUNCTION
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PasswordProtectedReview } from "./components/PasswordProtectedReview";
import { Metadata } from "next";
import { MediaInterface } from "./MediaInterface";
import { getFileCategory } from "@/app/dashboard/utilities";

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { token } = await params;

  // Get review link with media filename - ✅ INCLUDE THUMBNAIL FIELDS
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
        file_type,
        mime_type,
        r2_url,
        thumbnail_r2_url,
        thumbnail_r2_key
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

  // ✅ GET IMAGE URL FOR SOCIAL MEDIA - ONLY FOR IMAGES AND VIDEOS WITH THUMBNAILS
  const getImageUrl = () => {
    if (!reviewLink.media) return null;

    const fileCategory = getFileCategory(
      reviewLink.media.file_type,
      reviewLink.media.mime_type
    );

    // For images: use thumbnail if available, fallback to original image
    if (fileCategory === "image") {
      if (
        reviewLink.media.thumbnail_r2_url &&
        reviewLink.media.thumbnail_r2_url.trim() !== ""
      ) {
        return reviewLink.media.thumbnail_r2_url;
      }
      return reviewLink.media.r2_url; // Original image
    }

    // For videos: ONLY use thumbnail if available, no fallback
    if (fileCategory === "video") {
      if (
        reviewLink.media.thumbnail_r2_url &&
        reviewLink.media.thumbnail_r2_url.trim() !== ""
      ) {
        return reviewLink.media.thumbnail_r2_url;
      }
      return null; // No image for videos without thumbnails
    }

    // For all other file types: no image
    return null;
  };

  const imageUrl = getImageUrl();
  const fileCategory = reviewLink.media
    ? getFileCategory(reviewLink.media.file_type, reviewLink.media.mime_type)
    : null;

  // ✅ BASE METADATA - ALWAYS PRESENT
  const baseMetadata = {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: fileCategory === "video" ? "video.other" : "website",
      // ✅ ADD VIDEO METADATA FOR ALL VIDEOS
      ...(fileCategory === "video" &&
        reviewLink.media && {
          videos: [
            {
              url: reviewLink.media.r2_url || "",
              type: reviewLink.media.mime_type,
            },
          ],
        }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: title,
      description: description,
      // ✅ ADD VIDEO PLAYER FOR ALL VIDEOS
      ...(fileCategory === "video" &&
        reviewLink.media && {
          player: {
            url: reviewLink.media.r2_url || "",
            width: 1280,
            height: 720,
          },
        }),
    },
    robots: {
      index: false, // Don't index review links for privacy
      follow: false,
    },
  };

  // ✅ ADD IMAGES ONLY IF WE HAVE A VALID IMAGE URL
  if (imageUrl) {
    const mediaType = (() => {
      switch (fileCategory) {
        case "video":
          return "Video";
        case "audio":
          return "Audio";
        case "image":
          return "Image";
        case "document":
          return "Document";
        case "svg":
          return "SVG";
        default:
          return "Media";
      }
    })();

    baseMetadata.openGraph.images = [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt:
          fileCategory === "image" ? mediaName : `${mediaName} - ${mediaType}`,
      },
    ];
    baseMetadata.twitter.images = [imageUrl];
  }

  return baseMetadata;
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
      .select("id, full_name, display_name, email, avatar_url")
      .eq("user_id", user.id)
      .single();

    userProfile = profile;
  }

  // ✅ Get review link with project info - INCLUDE THUMBNAIL FIELDS
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
        project_id,
        project:projects (
          id,
          name,
          description,
          editor_id
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
          status,
          thumbnail_r2_url,
          thumbnail_r2_key,
          thumbnail_generated_at
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

  // ✅ USE RPC FUNCTION TO CHECK PROJECT ACCESS
  let userProjectRelationship = null;
  if (user && reviewLink.project_id) {
    const { data: accessData, error: accessError } = await supabase
      .rpc("check_project_access", {
        project_uuid: reviewLink.project_id,
        user_uuid: user.id,
      })
      .single();

    if (accessData && !accessError) {
      const { has_access, role, is_owner, project_exists } = accessData;

      if (has_access && role === "owner") {
        userProjectRelationship = {
          role: "owner",
          isOwner: true,
          isMember: false,
          isOutsider: false,
        };
      } else if (has_access && role && role !== "owner") {
        userProjectRelationship = {
          role: role,
          isOwner: false,
          isMember: true,
          isOutsider: false,
        };
      } else if (project_exists && !has_access) {
        userProjectRelationship = {
          role: "outsider",
          isOwner: false,
          isMember: false,
          isOutsider: true,
        };
      }
    }
  }

  // If no relationship determined yet, set defaults
  if (!userProjectRelationship) {
    if (user) {
      userProjectRelationship = {
        role: "outsider",
        isOwner: false,
        isMember: false,
        isOutsider: true,
      };
    } else {
      userProjectRelationship = {
        role: "guest",
        isOwner: false,
        isMember: false,
        isOutsider: false,
      };
    }
  }

  // Get all versions if this media has versions and determine current media to show - ✅ INCLUDE THUMBNAIL FIELDS
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
          status,
          thumbnail_r2_url,
          thumbnail_r2_key,
          thumbnail_generated_at
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
      projectId={reviewLink.project_id} // ✅ THIS IS ALREADY CORRECT
      reviewToken={token}
      reviewLinkData={reviewLink} // ✅ PASS THE ENTIRE REVIEW LINK DATA
      allowDownload={reviewLink.allow_download ?? false}
      userProjectRelationship={userProjectRelationship}
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