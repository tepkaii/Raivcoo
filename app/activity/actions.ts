// app/activity/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getActivityNotifications(limit: number = 50) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's activity notifications
    const { data: activities, error } = await supabase
      .from("activity_notifications")
      .select(
        `
        id,
        title,
        description,
        activity_data,
        actor_name,
        is_read,
        created_at,
        project_id,
        projects (
          id,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error getting activities:", error);
      return { success: false, error: error.message };
    }

    return { success: true, activities: activities || [] };
  } catch (error) {
    console.error("Failed to get activities:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get activities",
    };
  }
}

export async function markActivityAsRead(activityId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update activity as read
    const { error } = await supabase
      .from("activity_notifications")
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("user_id", user.id); // Ensure user owns this activity

    if (error) {
      console.error("Error marking activity as read:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark activity as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read",
    };
  }
}

export async function markAllActivitiesAsRead() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update all unread activities as read
    const { error } = await supabase
      .from("activity_notifications")
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all activities as read:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all activities as read:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mark all as read",
    };
  }
}

export async function deleteActivity(activityId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete activity
    const { error } = await supabase
      .from("activity_notifications")
      .delete()
      .eq("id", activityId)
      .eq("user_id", user.id); // Ensure user owns this activity

    if (error) {
      console.error("Error deleting activity:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete activity",
    };
  }
}

export async function getUnreadActivityCount() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get count of unread activities
    const { count, error } = await supabase
      .from("activity_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error getting unread count:", error);
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get unread count",
    };
  }
}

export async function deleteAllActivities() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete all activities for the user
    const { error } = await supabase
      .from("activity_notifications")
      .delete()
      .eq("user_id", user.id); // This ensures only the user's notifications are deleted

    if (error) {
      console.error("Error deleting all activities:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete all activities:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete all activities",
    };
  }
}