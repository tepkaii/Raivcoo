// lib/user-utils.ts
import { createClient } from "@/utils/supabase/server";

export async function findUserByEmail(email: string) {
  const supabase = await createClient();

  // First try auth.users
  const { data: authUser } = await supabase
    .from("auth.users")
    .select("id, email")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (authUser) {
    return authUser;
  }

  // Then try editor_profiles
  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("user_id, email")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (editorProfile) {
    // Get the corresponding auth user
    const { data: authUserFromProfile } = await supabase
      .from("auth.users")
      .select("id, email")
      .eq("id", editorProfile.user_id)
      .single();

    return authUserFromProfile;
  }

  return null;
}
