// app/settings/notifications/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_PREFERENCES = {
  comments: {
    all_comments: { enabled: true, delivery: "both" },
    replies_to_me: { enabled: true, delivery: "both" },
  },
  media: {
    my_uploads: { enabled: false, delivery: "activity" },
    others_uploads: { enabled: true, delivery: "both" },
    my_deletes: { enabled: false, delivery: "activity" },
    others_deletes: { enabled: true, delivery: "both" },
  },
  status_changes: {
    enabled: true,
    levels: ["approved", "rejected"],
    delivery: "both",
  },
};

export async function updateNotificationPreferences(preferences: any) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update user preferences using upsert
    const { error } = await supabase
      .from("user_notification_preferences")
      .upsert(
        {
          user_id: user.id,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error("Error updating preferences:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settings/notifications");

    return {
      success: true,
      message: "Notification preferences updated successfully",
    };
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update preferences",
    };
  }
}

export async function getNotificationPreferences() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user preferences - use maybeSingle() instead of single()
    const { data: preferences, error } = await supabase
      .from("user_notification_preferences")
      .select("preferences")
      .eq("user_id", user.id)
      .maybeSingle(); // This won't throw error if no rows found

    if (error) {
      console.error("Error getting preferences:", error);
      return { success: false, error: error.message };
    }

    // If no preferences found, return defaults
    if (!preferences) {
      console.log("No preferences found, returning defaults");
      return { success: true, preferences: DEFAULT_PREFERENCES };
    }

    return {
      success: true,
      preferences: preferences.preferences || DEFAULT_PREFERENCES,
    };
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get preferences",
    };
  }
}

// Helper function to ensure user has preferences record
export async function ensureUserPreferences() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Insert default preferences if they don't exist
    const { error } = await supabase
      .from("user_notification_preferences")
      .insert({
        user_id: user.id,
        preferences: DEFAULT_PREFERENCES,
      })
      .select()
      .maybeSingle();

    // Ignore conflict errors (user already has preferences)
    if (error && !error.message.includes("duplicate key")) {
      console.error("Error creating default preferences:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to ensure user preferences:", error);
    return { success: false, error: "Failed to create default preferences" };
  }
}
