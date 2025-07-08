// app/dashboard/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadFileToR2, getPublicUrl, deleteFileFromR2 } from "@/lib/r2";
import { nanoid } from "nanoid";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    throw new Error("Failed to fetch editor profile");

  // Get user's subscription status
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", user.id)
    .single();

  // Count existing owned projects
  const { data: existingProjects, error: countError } = await supabase
    .from("projects")
    .select("id")
    .eq("editor_id", editorProfile.id);

  if (countError) {
    console.error("Error counting projects:", countError);
    throw new Error("Failed to verify project limits");
  }

  const projectCount = existingProjects?.length || 0;

  // Define limits
  const FREE_PROJECT_LIMIT = 2;

  // Check subscription status and plan
  const hasPaidPlan =
    subscription &&
    (subscription.plan_id === "lite" || subscription.plan_id === "pro");
  const isActive = subscription && subscription.status === "active";
  const isExpired =
    subscription &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) < new Date();

  // Determine if user has unlimited projects
  const hasUnlimitedProjects = hasPaidPlan && isActive && !isExpired;

  // Validate project limits
  if (!hasUnlimitedProjects) {
    // User is on free plan limits (either no subscription, free plan, inactive subscription, or expired)
    if (projectCount >= FREE_PROJECT_LIMIT) {
      let errorMessage = "";

      if (!subscription || subscription.plan_id === "free") {
        // No subscription or free plan
        errorMessage = `Free plan allows only ${FREE_PROJECT_LIMIT} projects. You currently have ${projectCount}/${FREE_PROJECT_LIMIT}. Please upgrade to Lite or Pro for unlimited projects.`;
      } else if (!isActive) {
        // Inactive subscription
        errorMessage = `Your ${subscription.plan_id} subscription is inactive. You can create up to ${FREE_PROJECT_LIMIT} projects on the free plan, but you've reached that limit (${projectCount}/${FREE_PROJECT_LIMIT}). Please reactivate your subscription for unlimited projects.`;
      } else if (isExpired) {
        // Expired subscription
        errorMessage = `Your ${subscription.plan_id} subscription has expired. You can create up to ${FREE_PROJECT_LIMIT} projects on the free plan, but you've reached that limit (${projectCount}/${FREE_PROJECT_LIMIT}). Please renew your subscription for unlimited projects.`;
      } else {
        // Fallback error
        errorMessage = `You've reached the project limit (${projectCount}/${FREE_PROJECT_LIMIT}). Please upgrade to Lite or Pro for unlimited projects.`;
      }

      throw new Error(errorMessage);
    }
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const referencesJson = formData.get("references") as string;

  if (!name?.trim()) {
    throw new Error("Project name is required");
  }

  // Parse references
  let references = [];
  if (referencesJson) {
    try {
      references = JSON.parse(referencesJson);
    } catch (error) {
      console.error("Error parsing references:", error);
      // Continue without references if parsing fails
    }
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        editor_id: editorProfile.id,
        name: name.trim(),
        description: description?.trim() || null,
        project_references: references,
      })
      .select("id, name")
      .single();

    if (projectError) throw projectError;

    revalidatePath("/dashboard/projects");

    return {
      message: "Project workspace created successfully",
      project,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during project creation.");
  }
}

// Updated helper function to get subscription info
export async function getSubscriptionInfo(userId: string) {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end, plan_name")
    .eq("user_id", userId)
    .single();

  const hasPaidPlan =
    subscription &&
    (subscription.plan_id === "lite" || subscription.plan_id === "pro");
  const isActive = subscription && subscription.status === "active";
  const isExpired =
    subscription &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) < new Date();
  const hasUnlimitedProjects = hasPaidPlan && isActive && !isExpired;
  const isFreePlan =
    !subscription || subscription.plan_id === "free" || !hasUnlimitedProjects;

  return {
    subscription,
    hasPaidPlan,
    isActive,
    isExpired,
    hasUnlimitedProjects,
    isFreePlan,
    plan: subscription?.plan_id || "free",
    status: subscription?.status || "inactive",
    planName: subscription?.plan_name || "Free",
  };
}

// Updated helper function for the dashboard page
export async function getPlanLimits(
  planId: string | null,
  hasActiveSubscription: boolean
) {
  // If no active subscription or free plan, apply free limits
  if (!hasActiveSubscription || !planId || planId === "free") {
    return {
      maxProjects: 2,
      planName: "Free",
      isActive: false,
      hasLimit: true,
    };
  }

  // Both lite and pro have unlimited projects when active
  switch (planId) {
    case "lite":
      return {
        maxProjects: -1, // unlimited
        planName: "Lite",
        isActive: true,
        hasLimit: false,
      };
    case "pro":
      return {
        maxProjects: -1, // unlimited
        planName: "Pro",
        isActive: true,
        hasLimit: false,
      };
    default:
      return {
        maxProjects: 2,
        planName: "Free",
        isActive: false,
        hasLimit: true,
      };
  }
}

export async function uploadMedia(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const projectId = formData.get("projectId") as string;
  const files = formData.getAll("files") as File[];

  if (!projectId || !files.length) {
    throw new Error("Project ID and files are required");
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (project.editor_id !== editorProfile?.id) {
    throw new Error("Unauthorized");
  }

  const uploadedFiles = [];

  for (const file of files) {
    try {
      // Generate unique filename
      const fileExtension = file.name.split(".").pop();
      const uniqueFilename = `${nanoid()}.${fileExtension}`;
      const r2Key = `projects/${projectId}/${uniqueFilename}`;

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to R2
      await uploadFileToR2(r2Key, buffer, file.type);
      const publicUrl = getPublicUrl(r2Key);

      // Determine file type
      const fileType = file.type.startsWith("video/") ? "video" : "image";

      // Save to database
      const { data: mediaFile, error: mediaError } = await supabase
        .from("project_media")
        .insert({
          project_id: projectId,
          filename: uniqueFilename,
          original_filename: file.name,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          r2_key: r2Key,
          r2_url: publicUrl,
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      uploadedFiles.push(mediaFile);
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`);

  return {
    message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    files: uploadedFiles,
  };
}

export async function createReviewLink(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const projectId = formData.get("projectId") as string;
  const mediaId = formData.get("mediaId") as string;
  const title = formData.get("title") as string;

  if (!projectId || !mediaId) {
    throw new Error("Project ID and Media ID are required");
  }

  // Verify ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (project.editor_id !== editorProfile?.id) {
    throw new Error("Unauthorized");
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
    message: "Review link created successfully",
    reviewLink: reviewLink,
    reviewUrl: reviewUrl,
  };
}
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    throw new Error("Failed to fetch editor profile");

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    if (project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized - You don't own this project");
    }

    // Get all media files to delete from R2
    const { data: mediaFiles, error: mediaError } = await supabase
      .from("project_media")
      .select("r2_key")
      .eq("project_id", projectId);

    if (mediaError) {
      console.error("Error fetching media files:", mediaError);
    }

    // Delete all media files from R2
    if (mediaFiles && mediaFiles.length > 0) {
      for (const media of mediaFiles) {
        try {
          await deleteFileFromR2(media.r2_key);
        } catch (r2Error) {
          console.error("R2 deletion error for:", media.r2_key, r2Error);
          // Continue with other files even if one fails
        }
      }
    }

    // Delete the project (this will cascade delete all related data due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard/projects");

    return {
      message: `Project "${project.name}" and all its content have been permanently deleted`,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during project deletion.");
  }
}

export async function renameProject(projectId: string, newName: string) {
  try {
    const supabase = await createClient();

    // Update the project name
    const { data, error } = await supabase
      .from("projects")
      .update({
        name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error renaming project:", error);
      throw new Error("Failed to rename project");
    }

    revalidatePath("/dashboard/projects");

    return {
      success: true,
      message: `Project renamed to "${newName}"`,
      data,
    };
  } catch (error) {
    console.error("Error in renameProject:", error);
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  updates: {
    name?: string;
    notifications_enabled?: boolean;
    member_notifications_enabled?: boolean;
  }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (profileError || !editorProfile)
      throw new Error("Failed to fetch editor profile");

    // Check if user is owner or member
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    const isOwner = project.editor_id === editorProfile.id;

    if (!isOwner) {
      // Check if user is a member
      const { data: membership, error: memberError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .single();

      if (memberError || !membership) {
        throw new Error("Unauthorized - You are not a member of this project");
      }
    }

    let message = "Updated successfully";

    if (isOwner) {
      // Owner updates: project name and/or owner notifications
      if (
        updates.name !== undefined ||
        updates.notifications_enabled !== undefined
      ) {
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name;
        }

        if (updates.notifications_enabled !== undefined) {
          updateData.notifications_enabled = updates.notifications_enabled;
        }

        const { error } = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", projectId);

        if (error) {
          console.error("Error updating project:", error);
          throw new Error("Failed to update project");
        }

        // Create message
        if (updates.name && updates.notifications_enabled !== undefined) {
          message = `Project renamed to "${updates.name}" and notifications ${
            updates.notifications_enabled ? "enabled" : "disabled"
          }`;
        } else if (updates.name) {
          message = `Project renamed to "${updates.name}"`;
        } else if (updates.notifications_enabled !== undefined) {
          message = `Notifications ${
            updates.notifications_enabled ? "enabled" : "disabled"
          }`;
        }
      }
    } else {
      // Member updates: only their own notification preferences
      if (updates.member_notifications_enabled !== undefined) {
        const { error } = await supabase
          .from("project_members")
          .update({
            notifications_enabled: updates.member_notifications_enabled,
          })
          .eq("project_id", projectId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating member notifications:", error);
          throw new Error("Failed to update notification preferences");
        }

        message = `Notifications ${
          updates.member_notifications_enabled ? "enabled" : "disabled"
        }`;
      }
    }

    revalidatePath("/dashboard/projects");

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Error in updateProject:", error);
    throw error;
  }
}
