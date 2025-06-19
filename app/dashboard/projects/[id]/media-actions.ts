// app/dashboard/projects/[id]/media-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getAuthenticatedEditor() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) {
    redirect("/account");
  }

  return { supabase, user, editorProfile };
}

// Update the deleteMediaAction function in media-actions.ts

export async function deleteMediaAction(projectId: string, mediaId: string) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.editor_id !== editorProfile.id) {
      throw new Error("Project not found or unauthorized");
    }

    // Get media file info including versions
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id, r2_key, parent_media_id, is_current_version")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    // Store parent ID for potential renumbering
    let parentIdForRenumbering = media.parent_media_id;

    // If this is a parent media, we need to handle its versions
    if (!media.parent_media_id) {
      // Get all versions of this media
      const { data: versions } = await supabase
        .from("project_media")
        .select("id, r2_key")
        .eq("parent_media_id", mediaId);

      // Delete all versions from R2 and database
      if (versions) {
        for (const version of versions) {
          try {
            await deleteFileFromR2(version.r2_key);
          } catch (r2Error) {
            console.error("R2 deletion error for version:", r2Error);
          }

          // Delete version from database
          await supabase.from("project_media").delete().eq("id", version.id);
        }
      }
    } else {
      // This is a version, check if we need to update current version
      if (media.is_current_version) {
        // Find another version to set as current, prefer the highest version number
        const { data: otherVersions } = await supabase
          .from("project_media")
          .select("id, version_number")
          .or(
            `id.eq.${media.parent_media_id},parent_media_id.eq.${media.parent_media_id}`
          )
          .neq("id", mediaId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (otherVersions && otherVersions.length > 0) {
          // Set the highest version as current
          await supabase
            .from("project_media")
            .update({ is_current_version: true })
            .eq("id", otherVersions[0].id);
        }
      }
    }

    // Delete from R2
    try {
      await deleteFileFromR2(media.r2_key);
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // Delete related review links
    await supabase.from("review_links").delete().eq("media_id", mediaId);

    // Delete media from database
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      throw deleteError;
    }

    // If we deleted a version, renumber the remaining versions
    if (parentIdForRenumbering) {
      await renumberVersionsAction(parentIdForRenumbering);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete media error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
    };
  }
}

export async function createReviewLinkAction(
  projectId: string,
  mediaId: string,
  title?: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.editor_id !== editorProfile.id) {
      throw new Error("Project not found or unauthorized");
    }

    // Verify media belongs to project
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    // Generate unique token
    const linkToken = nanoid(12);

    const { data: reviewLink, error: linkError } = await supabase
      .from("review_links")
      .insert({
        project_id: projectId,
        media_id: mediaId,
        link_token: linkToken,
        title: title?.trim() || null,
      })
      .select()
      .single();

    if (linkError) throw linkError;

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${linkToken}`;

    return {
      success: true,
      reviewLink,
      reviewUrl,
    };
  } catch (error) {
    console.error("Create review link error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create review link",
    };
  }
}

export async function getReviewLinksAction(projectId: string, mediaId: string) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.editor_id !== editorProfile.id) {
      throw new Error("Project not found or unauthorized");
    }

    // Verify media belongs to project
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    // Get review links
    const { data: links, error: linksError } = await supabase
      .from("review_links")
      .select("*")
      .eq("media_id", mediaId)
      .order("created_at", { ascending: false });

    if (linksError) throw linksError;

    return {
      success: true,
      links: links || [],
    };
  } catch (error) {
    console.error("Get review links error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch review links",
    };
  }
}

export async function toggleReviewLinkAction(
  linkId: string,
  isActive: boolean
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify review link ownership through project
    const { data: reviewLink, error: linkError } = await supabase
      .from("review_links")
      .select(
        `
        id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", linkId)
      .single();

    if (
      linkError ||
      !reviewLink ||
      reviewLink.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Review link not found or unauthorized");
    }

    // Update the review link status
    const { error: updateError } = await supabase
      .from("review_links")
      .update({ is_active: isActive })
      .eq("id", linkId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Toggle review link error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update review link",
    };
  }
}

export async function addVersionToMediaAction(
  parentMediaId: string,
  newMediaId: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify parent media ownership through project
    const { data: parentMedia, error: parentError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", parentMediaId)
      .single();

    if (
      parentError ||
      !parentMedia ||
      parentMedia.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Parent media not found or unauthorized");
    }

    // Get the next version number
    const { data: existingVersions } = await supabase
      .from("project_media")
      .select("version_number")
      .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersionNumber =
      existingVersions && existingVersions.length > 0
        ? existingVersions[0].version_number + 1
        : 2; // Parent is version 1

    // Set all other versions (including parent) to not current
    await supabase
      .from("project_media")
      .update({ is_current_version: false })
      .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`);

    // Update the new media to be a version of the parent
    const { error: updateError } = await supabase
      .from("project_media")
      .update({
        parent_media_id: parentMediaId,
        version_number: nextVersionNumber,
        is_current_version: true, // New version becomes current
      })
      .eq("id", newMediaId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${parentMedia.project_id}`);

    return {
      success: true,
      versionNumber: nextVersionNumber,
    };
  } catch (error) {
    console.error("Add version to media error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add version to media",
    };
  }
}

export async function setCurrentVersionAction(
  parentMediaId: string,
  versionId: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify parent media ownership through project
    const { data: parentMedia, error: parentError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", parentMediaId)
      .single();

    if (
      parentError ||
      !parentMedia ||
      parentMedia.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Parent media not found or unauthorized");
    }

    // Set all versions (including parent) to not current
    await supabase
      .from("project_media")
      .update({ is_current_version: false })
      .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`);

    // Set the specified version as current
    const { error: setCurrentError } = await supabase
      .from("project_media")
      .update({ is_current_version: true })
      .eq("id", versionId);

    if (setCurrentError) throw setCurrentError;

    revalidatePath(`/dashboard/projects/${parentMedia.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Set current version error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set current version",
    };
  }
}

export async function reorderVersionsAction(
  parentMediaId: string,
  versionOrders: Array<{ mediaId: string; versionNumber: number }>
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify parent media ownership through project
    const { data: parentMedia, error: parentError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", parentMediaId)
      .single();

    if (
      parentError ||
      !parentMedia ||
      parentMedia.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Parent media not found or unauthorized");
    }

    // Update version numbers for each media file
    for (const { mediaId, versionNumber } of versionOrders) {
      const { error: updateError } = await supabase
        .from("project_media")
        .update({ version_number: versionNumber })
        .eq("id", mediaId);

      if (updateError) throw updateError;
    }

    revalidatePath(`/dashboard/projects/${parentMedia.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Reorder versions error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder versions",
    };
  }
}

export async function renumberVersionsAction(parentMediaId: string) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify parent media ownership through project
    const { data: parentMedia, error: parentError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", parentMediaId)
      .single();

    if (
      parentError ||
      !parentMedia ||
      parentMedia.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Parent media not found or unauthorized");
    }

    // Get all versions sorted by upload date
    const { data: versions } = await supabase
      .from("project_media")
      .select("id, uploaded_at")
      .eq("parent_media_id", parentMediaId)
      .order("uploaded_at", { ascending: true });

    if (!versions) return { success: true };

    // Renumber versions starting from 2 (parent is always 1)
    for (let i = 0; i < versions.length; i++) {
      const { error: updateError } = await supabase
        .from("project_media")
        .update({ version_number: i + 2 })
        .eq("id", versions[i].id);

      if (updateError) throw updateError;
    }

    revalidatePath(`/dashboard/projects/${parentMedia.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Renumber versions error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to renumber versions",
    };
  }
}
