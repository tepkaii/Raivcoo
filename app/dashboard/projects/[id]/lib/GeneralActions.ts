// app/dashboard/projects/[id]/lib/actions.ts
// @ts-nocheck
// @ts-ignore
// general actions
"use server";

import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

async function getAuthenticatedEditorWithProjectAccess(projectId: string) {
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

  // Check project access using the RPC function
  const accessCheck = await checkProjectAccess(supabase, projectId);

  if (!accessCheck.has_access) {
    throw new Error("Access denied");
  }

  return {
    supabase,
    user,
    editorProfile,
    accessCheck,
  };
}

// Legacy function for backwards compatibility
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

// Helper function to check specific permissions
function hasPermission(
  role: string | null,
  isOwner: boolean,
  action: string
): boolean {
  if (isOwner) return true; // Owners can do everything

  if (!role) return false;

  const permissions = {
    viewer: [],
    reviewer: ["editStatus"],
    collaborator: [
      "upload",
      "delete",
      "editStatus",
      "createReviewLinks",
      "manageVersions",
    ],
  };

  return (
    permissions[role as keyof typeof permissions]?.includes(action) || false
  );
}

export async function getReviewLinksAction(projectId: string, mediaId: string) {
  try {
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has review link access
    if (
      !hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "createReviewLinks"
      )
    ) {
      throw new Error("You don't have permission to view review links");
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
    // First get the project ID from the review link
    const supabase = await createClient();
    const { data: reviewLinkData } = await supabase
      .from("review_links")
      .select("project_id")
      .eq("id", linkId)
      .single();

    if (!reviewLinkData) throw new Error("Review link not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(
      reviewLinkData.project_id
    );

    // Check if user has review link management permission
    if (
      !hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "createReviewLinks"
      )
    ) {
      throw new Error("You don't have permission to manage review links");
    }

    // Update the review link status
    const { error: updateError } = await authSupabase
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
    // First get the project ID from the review link
    const supabase = await createClient();
    const { data: reviewLinkData } = await supabase
      .from("review_links")
      .select("project_id")
      .eq("id", linkId)
      .single();

    if (!reviewLinkData) throw new Error("Review link not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(
      reviewLinkData.project_id
    );

    // Check if user has review link management permission
    if (
      !hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "createReviewLinks"
      )
    ) {
      throw new Error("You don't have permission to manage review links");
    }

    const { error: deleteError } = await authSupabase
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
    // First get the project ID from the media
    const supabase = await createClient();
    const { data: mediaData } = await supabase
      .from("project_media")
      .select("project_id")
      .eq("id", parentMediaId)
      .single();

    if (!mediaData) throw new Error("Media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(mediaData.project_id);

    // Check if user has version management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageVersions")
    ) {
      throw new Error("You don't have permission to manage versions");
    }

    // Update version numbers and current version for each media file
    for (const version of reorderedVersions) {
      const { error: updateError } = await authSupabase
        .from("project_media")
        .update({
          version_number: version.version_number,
          is_current_version: version.is_current_version,
        })
        .eq("id", version.id);

      if (updateError) throw updateError;
    }

    revalidatePath(`/dashboard/projects/${mediaData.project_id}`);

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
    // First get the project ID from the media
    const supabase = await createClient();
    const { data: mediaData } = await supabase
      .from("project_media")
      .select("project_id")
      .eq("id", versionId)
      .single();

    if (!mediaData) throw new Error("Media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(mediaData.project_id);

    // Check if user has version management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageVersions")
    ) {
      throw new Error("You don't have permission to manage versions");
    }

    const { error: updateError } = await authSupabase
      .from("project_media")
      .update({ version_name: versionName.trim() || null })
      .eq("id", versionId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${mediaData.project_id}`);

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

export async function addVersionToMediaAction(
  parentMediaId: string,
  newMediaId: string
) {
  try {
    // First get the project ID from the parent media
    const supabase = await createClient();
    const { data: parentMediaData } = await supabase
      .from("project_media")
      .select("project_id")
      .eq("id", parentMediaId)
      .single();

    if (!parentMediaData) throw new Error("Parent media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(
      parentMediaData.project_id
    );

    // Check if user has version management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageVersions")
    ) {
      throw new Error("You don't have permission to manage versions");
    }

    // ✅ FIND THE CURRENT VERSION OF THE SOURCE GROUP
    let mediaToMove = newMediaId;

    // Get all media in the source group
    const sourceParentId = await authSupabase
      .from("project_media")
      .select("parent_media_id")
      .eq("id", newMediaId)
      .single();

    const actualSourceParentId =
      sourceParentId.data?.parent_media_id || newMediaId;

    // Find the current version in the source group
    const { data: currentVersionMedia } = await authSupabase
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
    const { data: existingVersions } = await authSupabase
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
    await authSupabase
      .from("project_media")
      .update({ is_current_version: false })
      .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`);

    // MOVE THE CURRENT VERSION (not the parent)
    const { error: updateError } = await authSupabase
      .from("project_media")
      .update({
        parent_media_id: parentMediaId,
        version_number: nextVersionNumber,
        is_current_version: true,
      })
      .eq("id", mediaToMove); // ← Move the current version!

    if (updateError) throw updateError;

    // REORGANIZE THE SOURCE GROUP
    if (mediaToMove !== newMediaId) {
      // The current version was moved, so we need to reorganize the source group
      const { data: remainingMedia } = await authSupabase
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
        await authSupabase
          .from("project_media")
          .update({
            parent_media_id: null,
            version_number: 1,
            is_current_version: true,
          })
          .eq("id", newParent.id);

        // Update other versions to be children of the new parent
        for (let i = 1; i < remainingMedia.length; i++) {
          await authSupabase
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

    revalidatePath(`/dashboard/projects/${parentMediaData.project_id}`);

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
    // First get the project ID from the parent media
    const supabase = await createClient();
    const { data: parentMediaData } = await supabase
      .from("project_media")
      .select("project_id")
      .eq("id", parentMediaId)
      .single();

    if (!parentMediaData) throw new Error("Parent media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(
      parentMediaData.project_id
    );

    // Check if user has version management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageVersions")
    ) {
      throw new Error("You don't have permission to manage versions");
    }

    // Get all versions sorted by upload date
    const { data: versions } = await authSupabase
      .from("project_media")
      .select("id, uploaded_at")
      .eq("parent_media_id", parentMediaId)
      .order("uploaded_at", { ascending: true });

    if (!versions) return { success: true };

    // Renumber versions starting from 2 (parent is always 1)
    for (let i = 0; i < versions.length; i++) {
      const { error: updateError } = await authSupabase
        .from("project_media")
        .update({ version_number: i + 2 })
        .eq("id", versions[i].id);

      if (updateError) throw updateError;
    }

    revalidatePath(`/dashboard/projects/${parentMediaData.project_id}`);

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

export async function updateVersionNumberAction(
  versionId: string,
  newVersionNumber: number
) {
  try {
    // First get the project ID from the media
    const supabase = await createClient();
    const { data: mediaData } = await supabase
      .from("project_media")
      .select("project_id, version_number, parent_media_id")
      .eq("id", versionId)
      .single();

    if (!mediaData) throw new Error("Media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(mediaData.project_id);

    // Check if user has version management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageVersions")
    ) {
      throw new Error("You don't have permission to manage versions");
    }

    // Check if the new version number conflicts with existing versions
    const parentId = mediaData.parent_media_id || versionId;

    const { data: conflictingVersion } = await authSupabase
      .from("project_media")
      .select("id")
      .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`)
      .eq("version_number", newVersionNumber)
      .neq("id", versionId)
      .single();

    if (conflictingVersion) {
      // Swap version numbers if there's a conflict
      const { error: swapError } = await authSupabase
        .from("project_media")
        .update({ version_number: mediaData.version_number })
        .eq("id", conflictingVersion.id);

      if (swapError) throw swapError;
    }

    // Update the version number
    const { error: updateError } = await authSupabase
      .from("project_media")
      .update({ version_number: newVersionNumber })
      .eq("id", versionId);

    if (updateError) throw updateError;

    // Update current version status based on version numbers
    // Get all versions and find the highest version number
    const { data: allVersions } = await authSupabase
      .from("project_media")
      .select("id, version_number")
      .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`)
      .order("version_number", { ascending: false });

    if (allVersions && allVersions.length > 0) {
      // Set all to not current first
      await authSupabase
        .from("project_media")
        .update({ is_current_version: false })
        .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`);

      // Set the highest version as current
      await authSupabase
        .from("project_media")
        .update({ is_current_version: true })
        .eq("id", allVersions[0].id);
    }

    revalidatePath(`/dashboard/projects/${mediaData.project_id}`);

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
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

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
    // First get the project ID from the media
    const supabase = await createClient();
    const { data: mediaData } = await supabase
      .from("project_media")
      .select("project_id")
      .eq("id", mediaId)
      .single();

    if (!mediaData) throw new Error("Media not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(mediaData.project_id);

    // Check if user has edit status permission
    const canEditStatus = hasPermission(
      accessCheck.role,
      accessCheck.is_owner,
      "editStatus"
    );
    if (!canEditStatus) {
      throw new Error(
        `You don't have permission to edit media status. Your role: ${accessCheck.role}, Owner: ${accessCheck.is_owner}`
      );
    }

    // Update the status
    const { error: updateError } = await authSupabase
      .from("project_media")
      .update({ status: newStatus })
      .eq("id", mediaId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw updateError;
    }

    revalidatePath(`/dashboard/projects/${mediaData.project_id}`);

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
    allowDownload: boolean;
  }
) {
  try {
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has review link creation permission
    if (
      !hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "createReviewLinks"
      )
    ) {
      throw new Error("You don't have permission to create review links");
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
      allow_download: options.allowDownload,
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

export async function updateReviewLinkAction(
  linkId: string,
  updates: {
    title?: string;
    expires_at?: string;
    requires_password?: boolean;
    password?: string;
    allow_download?: boolean;
  }
) {
  try {
    // First get the project ID from the review link
    const supabase = await createClient();
    const { data: reviewLinkData } = await supabase
      .from("review_links")
      .select("project_id")
      .eq("id", linkId)
      .single();

    if (!reviewLinkData) throw new Error("Review link not found");

    const {
      supabase: authSupabase,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(
      reviewLinkData.project_id
    );

    // Check if user has review link management permission
    if (
      !hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "createReviewLinks"
      )
    ) {
      throw new Error("You don't have permission to manage review links");
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

    if (updates.allow_download !== undefined) {
      updateData.allow_download = updates.allow_download;
    }

    const { error: updateError } = await authSupabase
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

export interface ProjectAccessCheck {
  has_access: boolean;
  role: string | null;
  is_owner: boolean;
  project_exists: boolean;
  membership_status: string | null;
}

export async function checkProjectAccess(
  supabase: any,
  projectId: string
): Promise<ProjectAccessCheck> {
  const { data, error } = await supabase
    .rpc("check_project_access", {
      project_uuid: projectId,
    })
    .single();

  if (error) {
    console.error("Error checking project access:", error);
    return {
      has_access: false,
      role: null,
      is_owner: false,
      project_exists: false,
      membership_status: null,
    };
  }

  return data;
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  newRole: "viewer" | "reviewer" | "collaborator"
) {
  try {
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Only owners can update member roles
    if (!accessCheck.is_owner) {
      throw new Error("Only project owners can update member roles");
    }

    const { error: updateError } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Update member role error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update member role",
    };
  }
}

// Update the leaveProject function in lib/actions.ts
export async function leaveProject(projectId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user (just for logging/validation)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Call the RPC function to leave the project
    const { data, error } = await supabase
      .rpc('leave_project', {
        project_uuid: projectId
      })
      .single();

    if (error) {
      console.error("RPC error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Check the result from the RPC function
    if (!data.success) {
      throw new Error(data.error);
    }

    console.log("Successfully left project:", data);

    // Revalidate paths to clear cache
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");

    return { 
      success: true, 
      message: data.message,
      deletedMembershipId: data.deleted_membership_id,
      userRole: data.user_role
    };
  } catch (error) {
    console.error("Leave project error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to leave project",
    };
  }
}
export async function canUserUploadToProject(projectId: string) {
  try {
    const { accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    return {
      success: true,
      canUpload: hasPermission(
        accessCheck.role,
        accessCheck.is_owner,
        "upload"
      ),
    };
  } catch (error) {
    return {
      success: false,
      canUpload: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check upload permission",
    };
  }
}

export async function getUserProjectPermissions(projectId: string) {
  try {
    const { accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    return {
      success: true,
      permissions: {
        canUpload: hasPermission(
          accessCheck.role,
          accessCheck.is_owner,
          "upload"
        ),
        canDelete: hasPermission(
          accessCheck.role,
          accessCheck.is_owner,
          "delete"
        ),
        canEditStatus: hasPermission(
          accessCheck.role,
          accessCheck.is_owner,
          "editStatus"
        ),
        canCreateReviewLinks: hasPermission(
          accessCheck.role,
          accessCheck.is_owner,
          "createReviewLinks"
        ),
        canManageVersions: hasPermission(
          accessCheck.role,
          accessCheck.is_owner,
          "manageVersions"
        ),
        canManageMembers: accessCheck.is_owner,
        isOwner: accessCheck.is_owner,
        role: accessCheck.role,
      },
    };
  } catch (error) {
    return {
      success: false,
      permissions: {
        canUpload: false,
        canDelete: false,
        canEditStatus: false,
        canCreateReviewLinks: false,
        canManageVersions: false,
        canManageMembers: false,
        isOwner: false,
        role: null,
      },
      error:
        error instanceof Error ? error.message : "Failed to get permissions",
    };
  }
}

export async function updateProjectReferencesAction(
  projectId: string,
  references: Array<{
    id: string;
    url: string;
    title?: string;
    customName?: string;
    favicon?: string;
    addedAt: string;
  }>
) {
  try {
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Basic access check (the RPC will do more detailed permission checking)
    if (!accessCheck.has_access) {
      throw new Error("Access denied");
    }

    // Call the RPC function to update project references
    const { data, error } = await supabase
      .rpc("update_project_references", {
        project_uuid: projectId,
        new_references: references,
      })
      .single();

    if (error) {
      console.error("RPC error:", error);
      throw new Error(error.message || "Failed to update project references");
    }

    // Check if the RPC function returned an error
    if (data && !data.success) {
      throw new Error(data.error || "Failed to update project references");
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      message: data?.message || "Project references updated successfully",
    };
  } catch (error) {
    console.error("Update project references error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update project references",
    };
  }
}

export async function updateMediaNameAction(
  projectId: string,
  mediaId: string,
  newName: string
) {
  try {
    const { supabase, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has upload permission (allows renaming)
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "upload")) {
      throw new Error("You don't have permission to rename media files");
    }

    // Validate the new name
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error("Media name cannot be empty");
    }

    if (trimmedName.length > 255) {
      throw new Error("Media name is too long (maximum 255 characters)");
    }

    // Get the specific media file
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id, original_filename, parent_media_id")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    // Update ONLY the specific media file that was selected
    const { data: updatedMedia, error: updateError } = await supabase
      .from("project_media")
      .update({ original_filename: trimmedName })
      .eq("id", mediaId) // ✅ Only update THIS specific media file
      .select("*")
      .single();

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      message: "Media name updated successfully",
      updatedMedia: [updatedMedia], // Return as array for consistency with handleMediaUpdated
    };
  } catch (error) {
    console.error("Update media name error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update media name",
    };
  }
}

export async function deleteAllReviewLinksAction(mediaId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Get count of links before deletion
    const { data: existingLinks } = await supabase
      .from("review_links")
      .select("id")
      .eq("media_id", mediaId);

    const linkCount = existingLinks?.length || 0;

    if (linkCount === 0) {
      return { 
        success: true, 
        deletedCount: 0,
        message: "No review links to delete"
      };
    }

    // Delete all review links for this media
    const { error: deleteError } = await supabase
      .from("review_links")
      .delete()
      .eq("media_id", mediaId);

    if (deleteError) throw deleteError;

    return { 
      success: true, 
      deletedCount: linkCount,
      message: `Successfully deleted all ${linkCount} review links`
    };
  } catch (error) {
    console.error("Delete all review links error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete all review links",
    };
  }
}
export async function moveMediaAction(
  projectId: string,
  mediaId: string,
  newFolderId?: string
) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has upload permission (allows moving media)
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "upload")) {
      throw new Error("You don't have permission to move media files");
    }

    // Verify media exists and belongs to project
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("*")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      throw new Error("Media not found");
    }

    // Verify new folder exists if specified
    if (newFolderId) {
      const { data: folder, error: folderError } = await supabase
        .from("project_folders")
        .select("id")
        .eq("id", newFolderId)
        .eq("project_id", projectId)
        .single();

      if (folderError || !folder) {
        throw new Error("Destination folder not found");
      }
    }

    // Move the media
    const { error: moveError } = await supabase
      .from("project_media")
      .update({
        folder_id: newFolderId || null,
        parent_media_id: null, // Remove from parent media if it was a version
      })
      .eq("id", mediaId);

    if (moveError) throw moveError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Move media error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move media",
    };
  }
}
