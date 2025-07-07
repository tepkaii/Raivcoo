"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function uploadImageToImgBB(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (file.length > AVATAR_MAX_SIZE) {
    throw new Error(
      `File size exceeds ${AVATAR_MAX_SIZE / (1024 * 1024)}MB limit`
    );
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(contentType)) {
    throw new Error("Invalid file type. Only JPEG, PNG and WebP are supported");
  }

  const formData = new FormData();
  formData.append("image", new Blob([file], { type: contentType }));
  formData.append("name", fileName);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.data?.url) {
    throw new Error("Invalid ImgBB response");
  }

  return data.data.url;
}

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  let returnTo: string | null = null;

  try {
    // Get required fields from form
    const displayName = (formData.get("display_name") as string)?.toLowerCase();
    const fullName = formData.get("full_name") as string;
    returnTo = formData.get("returnTo") as string;
    const avatarFile = formData.get("avatar") as File;

    // Basic validation
    if (!displayName || !fullName) {
      throw new Error("Display name and full name are required");
    }

    if (
      displayName.length < MIN_DISPLAY_NAME_LENGTH ||
      displayName.length > MAX_DISPLAY_NAME_LENGTH
    ) {
      throw new Error(
        `Display name must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters`
      );
    }

    // Check if display name is available
    const { data: existingNames, error: checkError } = await supabase
      .from("editor_profiles")
      .select("display_name")
      .eq("display_name", displayName)
      .neq("user_id", user.id)
      .limit(1);

    if (checkError) {
      console.error("Error checking display name:", checkError);
      throw new Error("Failed to validate display name");
    }

    if (existingNames && existingNames.length > 0) {
      throw new Error("This display name is already taken");
    }

    // Prepare profile data
    const profileData: any = {
      user_id: user.id,
      display_name: displayName,
      full_name: fullName.trim(),
      email: user.email,
    };

    // Handle avatar upload if provided
    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const avatarUrl = await uploadImageToImgBB(
        buffer,
        `avatar_${user.id}`,
        avatarFile.type
      );
      profileData.avatar_url = avatarUrl;
    }

    // Upsert profile
    const { error: updateError } = await supabase
      .from("editor_profiles")
      .upsert(profileData, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      });

    if (updateError) {
      console.error("Upsert error:", updateError);
      throw new Error(`Failed to complete profile: ${updateError.message}`);
    }

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Profile completion error:", error);
    throw error instanceof Error ? error : new Error("Unexpected error");
  }

  // Move redirect outside try-catch to prevent NEXT_REDIRECT error logging
  const redirectUrl = returnTo ? decodeURIComponent(returnTo) : "/dashboard";
  redirect(redirectUrl);
}

export async function validateDisplayName(
  displayName: string,
  currentDisplayName: string = ""
) {
  if (!displayName) {
    return {
      isValid: false,
      errors: ["Display name is required"],
    };
  }

  if (displayName.length < MIN_DISPLAY_NAME_LENGTH) {
    return {
      isValid: false,
      errors: [
        `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} characters`,
      ],
    };
  }

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      isValid: false,
      errors: [
        `Display name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`,
      ],
    };
  }

  // If display name didn't change, it's valid
  if (displayName === currentDisplayName) {
    return { isValid: true, errors: [] };
  }

  // Special characters validation
  if (!/^[a-z0-9_.-]+$/.test(displayName)) {
    return {
      isValid: false,
      errors: [
        "Only lowercase letters, numbers, underscores, dots, and hyphens are allowed",
      ],
    };
  }

  // Check availability in database
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("editor_profiles")
      .select("display_name")
      .eq("display_name", displayName)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return {
        isValid: false,
        errors: ["This display name is already taken"],
      };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    console.error("Error validating display name:", error);
    return {
      isValid: false,
      errors: ["Failed to validate display name"],
    };
  }
}
