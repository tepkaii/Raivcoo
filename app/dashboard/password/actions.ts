"use server";
//  password_protection action.ts
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcrypt";

// Update password protection - enable or update password
export async function updatePasswordProtection(
  userId: string,
  password: string
): Promise<{ message: string }> {
  const supabase = await createClient();
  // First, verify the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Not authorized");
  }

  try {
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create password JSON object
    const passwordData = {
      protected: true,
      hash: hashedPassword,
      updated_at: new Date().toISOString(),
    };

    // Update the profile with the new password data
    const { error } = await supabase
      .from("editor_profiles")
      .update({
        password_data: passwordData,
      })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    revalidatePath("/portfolio");
    return {
      message: "Password protection updated successfully",
    };
  } catch (error) {
    console.error("Error updating password protection:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

// Remove password protection
export async function removePasswordProtection(
  userId: string
): Promise<{ message: string }> {
  const supabase = await createClient();
  // First, verify the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Not authorized");
  }

  try {
    // Set password_data to indicate no protection
    const passwordData = {
      protected: false,
      hash: null,
      updated_at: new Date().toISOString(),
    };

    // Update the profile to remove password protection
    const { error } = await supabase
      .from("editor_profiles")
      .update({
        password_data: passwordData,
      })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    revalidatePath("/portfolio");
    return {
      message: "Password protection removed successfully",
    };
  } catch (error) {
    console.error("Error removing password protection:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

// Verify password - this would be used when someone tries to access a protected portfolio
export async function verifyPortfolioPassword(
  displayName: string,
  password: string
): Promise<{ valid: boolean; userId?: string }> {
  const supabase = await createClient();
  try {
    // Get the profile with the given display name
    const { data, error } = await supabase
      .from("editor_profiles")
      .select("user_id, password_data")
      .eq("display_name", displayName)
      .single();

    if (
      error ||
      !data ||
      !data.password_data ||
      !data.password_data.protected
    ) {
      return { valid: false };
    }

    // Verify the password
    const isValid = await bcrypt.compare(password, data.password_data.hash);
    return {
      valid: isValid,
      userId: isValid ? data.user_id : undefined,
    };
  } catch (error) {
    console.error("Error verifying portfolio password:", error);
    return { valid: false };
  }
}
