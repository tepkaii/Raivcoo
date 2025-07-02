// app/dashboard/projects/[id]/lib/actions.ts
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

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

      // Delete all review links for this parent media
      await supabase.from("review_links").delete().eq("media_id", mediaId);
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

export async function deleteReviewLinkAction(linkId: string) {
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

    const { error: deleteError } = await supabase
      .from("review_links")
      .delete()
      .eq("id", linkId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error("Delete review link error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete review link",
    };
  }
}

export async function reorderVersionsAction(
  parentMediaId: string,
  reorderedVersions: Array<{
    id: string;
    version_number: number;
    is_current_version: boolean;
  }>
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

    // Update version numbers and current version for each media file
    for (const version of reorderedVersions) {
      const { error: updateError } = await supabase
        .from("project_media")
        .update({
          version_number: version.version_number,
          is_current_version: version.is_current_version,
        })
        .eq("id", version.id);

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

export async function updateVersionNameAction(
  versionId: string,
  versionName: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify version ownership through project
    const { data: version, error: versionError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", versionId)
      .single();

    if (
      versionError ||
      !version ||
      version.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Version not found or unauthorized");
    }

    const { error: updateError } = await supabase
      .from("project_media")
      .update({ version_name: versionName.trim() || null })
      .eq("id", versionId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${version.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Update version name error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update version name",
    };
  }
}

export async function deleteVersionAction(versionId: string) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Get version info
    const { data: version, error: versionError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        r2_key,
        parent_media_id,
        is_current_version,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", versionId)
      .single();

    if (
      versionError ||
      !version ||
      version.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Version not found or unauthorized");
    }

    if (!version.parent_media_id) {
      throw new Error("Cannot delete parent media using this action");
    }

    // If this is the current version, set another version as current
    if (version.is_current_version) {
      const { data: otherVersions } = await supabase
        .from("project_media")
        .select("id, version_number")
        .or(
          `id.eq.${version.parent_media_id},parent_media_id.eq.${version.parent_media_id}`
        )
        .neq("id", versionId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (otherVersions && otherVersions.length > 0) {
        await supabase
          .from("project_media")
          .update({ is_current_version: true })
          .eq("id", otherVersions[0].id);
      }
    }

    // Delete from R2
    try {
      await deleteFileFromR2(version.r2_key);
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", versionId);

    if (deleteError) throw deleteError;

    // Renumber remaining versions
    await renumberVersionsAction(version.parent_media_id);

    revalidatePath(`/dashboard/projects/${version.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Delete version error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete version",
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

    // ✅ FIND THE CURRENT VERSION OF THE SOURCE GROUP
    let mediaToMove = newMediaId;

    // Get all media in the source group
    const sourceParentId = await supabase
      .from("project_media")
      .select("parent_media_id")
      .eq("id", newMediaId)
      .single();

    const actualSourceParentId =
      sourceParentId.data?.parent_media_id || newMediaId;

    // Find the current version in the source group
    const { data: currentVersionMedia } = await supabase
      .from("project_media")
      .select("id")
      .or(
        `id.eq.${actualSourceParentId},parent_media_id.eq.${actualSourceParentId}`
      )
      .eq("is_current_version", true)
      .single();

    if (currentVersionMedia) {
      mediaToMove = currentVersionMedia.id;
    }

    // Get the next version number for target
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

    // Set all other versions in target group to not current
    await supabase
      .from("project_media")
      .update({ is_current_version: false })
      .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`);

    // ✅ MOVE THE CURRENT VERSION (not the parent)
    const { error: updateError } = await supabase
      .from("project_media")
      .update({
        parent_media_id: parentMediaId,
        version_number: nextVersionNumber,
        is_current_version: true,
      })
      .eq("id", mediaToMove); // ← Move the current version!

    if (updateError) throw updateError;

    // ✅ REORGANIZE THE SOURCE GROUP
    if (mediaToMove !== newMediaId) {
      // The current version was moved, so we need to reorganize the source group
      const { data: remainingMedia } = await supabase
        .from("project_media")
        .select("id, version_number")
        .or(
          `id.eq.${actualSourceParentId},parent_media_id.eq.${actualSourceParentId}`
        )
        .neq("id", mediaToMove)
        .order("version_number", { ascending: true });

      if (remainingMedia && remainingMedia.length > 0) {
        // Make the lowest version the new parent
        const newParent = remainingMedia[0];

        // Update the new parent
        await supabase
          .from("project_media")
          .update({
            parent_media_id: null,
            version_number: 1,
            is_current_version: true,
          })
          .eq("id", newParent.id);

        // Update other versions to be children of the new parent
        for (let i = 1; i < remainingMedia.length; i++) {
          await supabase
            .from("project_media")
            .update({
              parent_media_id: newParent.id,
              version_number: i + 1,
              is_current_version: false,
            })
            .eq("id", remainingMedia[i].id);
        }
      }
    }

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
// Add this to your server actions file (paste-2.txt)

export async function updateVersionNumberAction(
  versionId: string,
  newVersionNumber: number
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify version ownership through project
    const { data: version, error: versionError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        version_number,
        parent_media_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", versionId)
      .single();

    if (
      versionError ||
      !version ||
      version.project.editor_id !== editorProfile.id
    ) {
      throw new Error("Version not found or unauthorized");
    }

    // Check if the new version number conflicts with existing versions
    const parentId = version.parent_media_id || version.id;

    const { data: conflictingVersion } = await supabase
      .from("project_media")
      .select("id")
      .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`)
      .eq("version_number", newVersionNumber)
      .neq("id", versionId)
      .single();

    if (conflictingVersion) {
      // Swap version numbers if there's a conflict
      const { error: swapError } = await supabase
        .from("project_media")
        .update({ version_number: version.version_number })
        .eq("id", conflictingVersion.id);

      if (swapError) throw swapError;
    }

    // Update the version number
    const { error: updateError } = await supabase
      .from("project_media")
      .update({ version_number: newVersionNumber })
      .eq("id", versionId);

    if (updateError) throw updateError;

    // Update current version status based on version numbers
    // Get all versions and find the highest version number
    const { data: allVersions } = await supabase
      .from("project_media")
      .select("id, version_number")
      .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`)
      .order("version_number", { ascending: false });

    if (allVersions && allVersions.length > 0) {
      // Set all to not current first
      await supabase
        .from("project_media")
        .update({ is_current_version: false })
        .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`);

      // Set the highest version as current
      await supabase
        .from("project_media")
        .update({ is_current_version: true })
        .eq("id", allVersions[0].id);
    }

    revalidatePath(`/dashboard/projects/${version.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Update version number error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update version number",
    };
  }
}

export async function getMediaDataAction(projectId: string, mediaId: string) {
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

    // Get the main media and all its versions
    const { data: mediaData, error: mediaError } = await supabase
      .from("project_media")
      .select("*")
      .or(`id.eq.${mediaId},parent_media_id.eq.${mediaId}`)
      .order("version_number", { ascending: true });

    if (mediaError) throw mediaError;

    if (!mediaData || mediaData.length === 0) {
      throw new Error("Media not found");
    }

    // Separate parent and versions
    const parent = mediaData.find((m) => !m.parent_media_id);
    const versions = mediaData.filter((m) => m.parent_media_id);

    if (!parent) {
      throw new Error("Parent media not found");
    }

    // Check if this media has review links
    const { data: reviewLinks } = await supabase
      .from("review_links")
      .select("id")
      .eq("media_id", parent.id)
      .limit(1);

    const hasReviewLinks = reviewLinks && reviewLinks.length > 0;

    // Find current version
    const currentVersion =
      mediaData.find((m) => m.is_current_version) || parent;

    const organizedMedia = {
      ...parent,
      versions,
      currentVersion,
      hasReviewLinks,
    };

    return {
      success: true,
      media: organizedMedia,
    };
  } catch (error) {
    console.error("Get media data error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch media data",
    };
  }
}
export async function updateMediaStatusAction(
  mediaId: string,
  newStatus: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify media ownership through project
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select(
        `
        id,
        project_id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", mediaId)
      .single();

    if (mediaError || !media || media.project.editor_id !== editorProfile.id) {
      throw new Error("Media not found or unauthorized");
    }

    // Update the status
    const { error: updateError } = await supabase
      .from("project_media")
      .update({ status: newStatus })
      .eq("id", mediaId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${media.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Update media status error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update media status",
    };
  }
}

export async function createReviewLinkAction(
  projectId: string,
  mediaId: string,
  options: {
    title: string;
    expiresAt?: string;
    requiresPassword: boolean;
    password?: string;
    allowDownload: boolean; // ✅ NEW PARAMETER
  }
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

    // Verify media belongs to project and is a parent (not a version)
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id, parent_media_id")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    if (media.parent_media_id) {
      throw new Error(
        "Review links can only be created for parent media, not versions"
      );
    }

    // Generate unique token
    const linkToken = nanoid(12);

    // Hash password if provided
    let passwordHash = null;
    if (options.requiresPassword && options.password) {
      passwordHash = await bcrypt.hash(options.password, 12);
    }

    const insertData: any = {
      project_id: projectId,
      media_id: mediaId,
      link_token: linkToken,
      title: options.title?.trim() || null,
      requires_password: options.requiresPassword,
      allow_download: options.allowDownload, // ✅ NEW FIELD
    };

    if (options.expiresAt) {
      insertData.expires_at = options.expiresAt;
    }

    if (passwordHash) {
      insertData.password_hash = passwordHash;
    }

    const { data: reviewLink, error: linkError } = await supabase
      .from("review_links")
      .insert(insertData)
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

// ✅ ALSO UPDATE THE updateReviewLinkAction function to handle the new field:
export async function updateReviewLinkAction(
  linkId: string,
  updates: {
    title?: string;
    expires_at?: string;
    requires_password?: boolean;
    password?: string;
    allow_download?: boolean; // ✅ NEW PARAMETER
  }
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

    const updateData: any = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title?.trim() || null;
    }

    if (updates.expires_at !== undefined) {
      updateData.expires_at = updates.expires_at || null;
    }

    if (updates.requires_password !== undefined) {
      updateData.requires_password = updates.requires_password;

      if (!updates.requires_password) {
        updateData.password_hash = null;
      }
    }

    if (updates.password && updates.requires_password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 12);
    }

    // ✅ NEW FIELD HANDLING
    if (updates.allow_download !== undefined) {
      updateData.allow_download = updates.allow_download;
    }

    const { error: updateError } = await supabase
      .from("review_links")
      .update(updateData)
      .eq("id", linkId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Update review link error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update review link",
    };
  }
}