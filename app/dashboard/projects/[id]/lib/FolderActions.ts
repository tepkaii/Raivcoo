// app/dashboard/projects/[id]/lib/FolderActions.ts
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) {
    redirect("/account");
  }

  // Check project access using the RPC function
  const { data: accessCheck, error: accessError } = await supabase
    .rpc("check_project_access", {
      project_uuid: projectId,
    })
    .single();

  if (accessError || !accessCheck.has_access) {
    throw new Error("Access denied");
  }

  return {
    supabase,
    user,
    editorProfile,
    accessCheck,
  };
}

// Helper function to check specific permissions
function hasPermission(
  role: string | null,
  isOwner: boolean,
  action: string
): boolean {
  if (isOwner) return true;

  if (!role) return false;

  const permissions = {
    viewer: [],
    reviewer: [],
    collaborator: ["upload", "createFolders", "manageFolders"],
  };

  return (
    permissions[role as keyof typeof permissions]?.includes(action) || false
  );
}

export async function createFolderAction(
  projectId: string,
  name: string,
  description?: string,
  parentFolderId?: string,
  color?: string
) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has folder creation permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "createFolders")
    ) {
      throw new Error("You don't have permission to create folders");
    }

    // Validate folder name
    if (!name.trim()) {
      throw new Error("Folder name cannot be empty");
    }

    // Check for duplicate folder names in the same parent
    const { data: existingFolder } = await supabase
      .from("project_folders")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", name.trim())
      .eq("parent_folder_id", parentFolderId || null)
      .single();

    if (existingFolder) {
      throw new Error(
        "A folder with this name already exists in this location"
      );
    }

    // Get the next display order

    const { data: lastFolder } = await supabase
      .from("project_folders")
      .select("display_order")
      .eq("project_id", projectId)
      .eq("parent_folder_id", parentFolderId || null)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    const nextDisplayOrder = lastFolder ? lastFolder.display_order + 1 : 0;

    // Create the folder
    const { data: folder, error: folderError } = await supabase
      .from("project_folders")
      .insert({
        project_id: projectId,
        name: name.trim(),
        description: description?.trim() || null,
        parent_folder_id: parentFolderId || null,
        created_by: user.id,
        color: color || "#3B82F6",
        display_order: nextDisplayOrder,
      })
      .select()
      .single();

    if (folderError) throw folderError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      folder,
    };
  } catch (error) {
    console.error("Create folder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create folder",
    };
  }
}

export async function updateFolderAction(
  projectId: string,
  folderId: string,
  updates: {
    name?: string;
    description?: string;
    color?: string;
  }
) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has folder management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageFolders")
    ) {
      throw new Error("You don't have permission to manage folders");
    }

    // Verify folder exists and belongs to project
    const { data: folder, error: folderError } = await supabase
      .from("project_folders")
      .select("*")
      .eq("id", folderId)
      .eq("project_id", projectId)
      .single();

    if (folderError || !folder) {
      throw new Error("Folder not found");
    }

    // Check for duplicate names if name is being updated
    if (updates.name && updates.name.trim() !== folder.name) {
      const { data: existingFolder } = await supabase
        .from("project_folders")
        .select("id")
        .eq("project_id", projectId)
        .eq("name", updates.name.trim())
        .eq("parent_folder_id", folder.parent_folder_id)
        .neq("id", folderId)
        .single();

      if (existingFolder) {
        throw new Error(
          "A folder with this name already exists in this location"
        );
      }
    }

    // Update the folder
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }

    const { data: updatedFolder, error: updateError } = await supabase
      .from("project_folders")
      .update(updateData)
      .eq("id", folderId)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      folder: updatedFolder,
    };
  } catch (error) {
    console.error("Update folder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update folder",
    };
  }
}

export async function deleteFolderAction(projectId: string, folderId: string) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has folder management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageFolders")
    ) {
      throw new Error("You don't have permission to delete folders");
    }

    // Verify folder exists and belongs to project
    const { data: folder, error: folderError } = await supabase
      .from("project_folders")
      .select("*")
      .eq("id", folderId)
      .eq("project_id", projectId)
      .single();

    if (folderError || !folder) {
      throw new Error("Folder not found");
    }

    // RECURSIVE HELPER FUNCTION TO DELETE FOLDER AND ALL ITS CONTENTS
    async function deleteFolderRecursively(
      currentFolderId: string
    ): Promise<number> {
      let totalDeletedMedia = 0;

      // Get all subfolders
      const { data: subfolders } = await supabase
        .from("project_folders")
        .select("id")
        .eq("parent_folder_id", currentFolderId);

      // Recursively delete all subfolders first
      if (subfolders && subfolders.length > 0) {
        for (const subfolder of subfolders) {
          const deletedCount = await deleteFolderRecursively(subfolder.id);
          totalDeletedMedia += deletedCount;
        }
      }

      // Get all media files in the current folder
      const { data: mediaFiles, error: mediaError } = await supabase
        .from("project_media")
        .select(
          "id, r2_key, thumbnail_r2_key, original_filename, mime_type, file_size"
        )
        .eq("folder_id", currentFolderId);

      if (mediaError) {
        console.error("Error fetching media files:", mediaError);
        throw new Error("Failed to fetch media files");
      }

      // DELETE ALL MEDIA FILES FROM R2 STORAGE
      if (mediaFiles && mediaFiles.length > 0) {
        const { deleteFileFromR2, deleteThumbnailIfExists } = await import(
          "@/lib/r2"
        );

        for (const mediaFile of mediaFiles) {
          try {
            // Delete main file from R2
            await deleteFileFromR2(mediaFile.r2_key);

            // Delete thumbnail if exists
            if (mediaFile.thumbnail_r2_key) {
              await deleteThumbnailIfExists(mediaFile);
            }
          } catch (r2Error) {
            console.error(
              `❌ R2 deletion error for ${mediaFile.original_filename}:`,
              r2Error
            );
            // Continue with other files even if one fails
          }
        }

        // DELETE ALL MEDIA RECORDS FROM DATABASE
        const { error: deleteMediaError } = await supabase
          .from("project_media")
          .delete()
          .eq("folder_id", currentFolderId);

        if (deleteMediaError) {
          console.error("Error deleting media records:", deleteMediaError);
          throw new Error("Failed to delete media files");
        }

        totalDeletedMedia += mediaFiles.length;
      }

      // DELETE THE CURRENT FOLDER
      const { error: deleteError } = await supabase
        .from("project_folders")
        .delete()
        .eq("id", currentFolderId);

      if (deleteError) {
        console.error("Error deleting folder:", deleteError);
        throw new Error("Failed to delete folder");
      }

      return totalDeletedMedia;
    }

    // Start recursive deletion
    const totalDeletedMedia = await deleteFolderRecursively(folderId);

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      deletedMediaCount: totalDeletedMedia,
    };
  } catch (error) {
    console.error("Delete folder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete folder",
    };
  }
}

export async function getFoldersAction(projectId: string) {
  try {
    const { supabase, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Get all folders for the project
    const { data: folders, error: foldersError } = await supabase
      .from("project_folders")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true });

    if (foldersError) throw foldersError;

    // Get media count for each folder
    const { data: mediaCounts } = await supabase
      .from("project_media")
      .select("folder_id")
      .eq("project_id", projectId);

    const folderMediaCounts = new Map<string, number>();
    mediaCounts?.forEach((media) => {
      if (media.folder_id) {
        folderMediaCounts.set(
          media.folder_id,
          (folderMediaCounts.get(media.folder_id) || 0) + 1
        );
      }
    });

    // Add media counts to folders
    const foldersWithCounts = folders?.map((folder) => ({
      ...folder,
      media_count: folderMediaCounts.get(folder.id) || 0,
    }));

    return {
      success: true,
      folders: foldersWithCounts || [],
    };
  } catch (error) {
    console.error("Get folders error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get folders",
      folders: [],
    };
  }
}

export async function getFolderMediaAction(
  projectId: string,
  folderId: string
): Promise<{
  success: boolean;
  mediaFiles?: any[];
  reviewLinks?: any[];
  error?: string;
}> {
  try {
    const { supabase, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Verify folder exists and belongs to project
    const { data: folder, error: folderError } = await supabase
      .from("project_folders")
      .select("id")
      .eq("id", folderId)
      .eq("project_id", projectId)
      .single();

    if (folderError || !folder) {
      throw new Error("Folder not found");
    }

    // Get media files for this folder
    const { data: mediaFiles, error: mediaError } = await supabase
      .from("project_media")
      .select("*")
      .eq("project_id", projectId)
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });

    if (mediaError) {
      console.error("Error fetching media files:", mediaError);
      throw new Error("Failed to fetch media files");
    }

    // Get review links for media in this folder
    const mediaIds = mediaFiles?.map((file) => file.id) || [];
    let reviewLinks: any[] = [];

    if (mediaIds.length > 0) {
      const { data: links, error: linksError } = await supabase
        .from("review_links")
        .select("*")
        .in("media_id", mediaIds);

      if (!linksError) {
        reviewLinks = links || [];
      }
    }

    return {
      success: true,
      mediaFiles: mediaFiles || [],
      reviewLinks: reviewLinks || [],
    };
  } catch (error) {
    console.error("Get folder media error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get folder media",
      mediaFiles: [],
      reviewLinks: [],
    };
  }
}

export async function moveFolderAction(
  projectId: string,
  folderId: string,
  newParentFolderId?: string
) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has folder management permission
    if (
      !hasPermission(accessCheck.role, accessCheck.is_owner, "manageFolders")
    ) {
      throw new Error("You don't have permission to move folders");
    }

    // Verify folder exists and belongs to project
    const { data: folder, error: folderError } = await supabase
      .from("project_folders")
      .select("*")
      .eq("id", folderId)
      .eq("project_id", projectId)
      .single();

    if (folderError || !folder) {
      throw new Error("Folder not found");
    }

    // Verify new parent folder exists if specified
    if (newParentFolderId) {
      const { data: parentFolder, error: parentError } = await supabase
        .from("project_folders")
        .select("id")
        .eq("id", newParentFolderId)
        .eq("project_id", projectId)
        .single();

      if (parentError || !parentFolder) {
        throw new Error("Parent folder not found");
      }

      // Check for circular reference
      if (newParentFolderId === folderId) {
        throw new Error("Cannot move folder into itself");
      }
    }

    // Check for duplicate names in new location
    const { data: existingFolder } = await supabase
      .from("project_folders")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", folder.name)
      .eq("parent_folder_id", newParentFolderId || null)
      .neq("id", folderId)
      .single();

    if (existingFolder) {
      throw new Error(
        "A folder with this name already exists in the destination"
      );
    }

    // Move the folder
    const { error: moveError } = await supabase
      .from("project_folders")
      .update({
        parent_folder_id: newParentFolderId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId);

    if (moveError) throw moveError;

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Move folder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move folder",
    };
  }
}