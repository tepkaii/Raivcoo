"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
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

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    const { data: currentProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw new Error("Failed to fetch current profile");
    }

    let profileData: Record<string, any> = { ...currentProfile };

    // Handle avatar upload
    const avatarFile = formData.get("image") as File;
    if (avatarFile instanceof File) {
      if (avatarFile.size > AVATAR_MAX_SIZE) {
        throw new Error("Avatar file size exceeds limit");
      }
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const avatarUrl = await uploadImageToImgBB(
        buffer,
        `avatar_${user.id}`,
        avatarFile.type
      );
      profileData.avatar_url = avatarUrl;
    }

    // Handle fields
    const jsonFields = [
      "languages",
      "skills",
      "preferred_genres",
      "software_proficiency",
    ];
    for (const [key, value] of formData.entries()) {
      if (key === "image") continue;
      if (jsonFields.includes(key)) {
        try {
          profileData[key] = JSON.parse(value as string);
        } catch {
          profileData[key] = value;
        }
      } else {
        profileData[key] = value;
      }
    }

    // Handle password
    const plainPassword = formData.get("password") as string;

    if (plainPassword && plainPassword.length >= 6) {
      profileData.password_data = { plainPassword };
    }

    // Validate required fields
    const requiredFields = [
      "full_name",
      "display_name",
      "country",
      "biography",
    ];
    for (const field of requiredFields) {
      if (!profileData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check display name if changed
    if (
      profileData.display_name.toLowerCase() !==
      currentProfile.display_name.toLowerCase()
    ) {
      const { data, error } = await supabase
        .from("editor_profiles")
        .select("display_name")
        .eq("display_name", profileData.display_name.toLowerCase())
        .limit(1);

      if (error) {
        throw new Error("Failed to validate display name");
      }
      if (data.length > 0) {
        throw new Error("This display name is already taken");
      }
    }

    // Clean up undefined/null values
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] === undefined || profileData[key] === null) {
        delete profileData[key];
      }
    });

    // Remove password from being sent to db
    delete profileData.password;

    // Update profile
    const { error: updateError } = await supabase
      .from("editor_profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    revalidatePath("/profile");
    return { message: "Profile updated successfully" };
  } catch (error) {
    console.error("Profile update error:", error);
    throw error instanceof Error ? error : new Error("Unexpected error");
  }
}

export async function checkDisplayNameAvailability(displayName: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("editor_profiles")
    .select("display_name")
    .ilike("display_name", displayName)
    .limit(1);

  if (error) {
    console.error("Error checking display name availability:", error);
    throw new Error("Failed to check display name availability");
  }

  return { available: data.length === 0 };
}