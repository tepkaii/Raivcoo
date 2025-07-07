// login/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";


export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const provider = formData.get("provider") as "discord" | "google" | undefined;
  const returnTo = formData.get("returnTo") as string | undefined;
  const supabase = await createClient();

  if (provider) {
    // For OAuth, encode returnTo in the callback URL
    const callbackUrl = returnTo
      ? `https://www.raivcoo.com/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
      : `https://www.raivcoo.com/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return redirect(data.url);
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  }

  // After successful login, check if profile is complete
  const profileCheckUrl = await checkProfileCompletion(returnTo);
  if (profileCheckUrl) {
    redirect(profileCheckUrl);
  }

  // Redirect to returnTo URL if provided, otherwise go to home
  const redirectUrl = returnTo ? decodeURIComponent(returnTo) : "/";
  redirect(redirectUrl);
}

export async function checkProfileCompletion(returnTo?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // No user, let other auth checks handle this
  }

  // Check if user has a complete profile
  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("display_name, full_name")
    .eq("user_id", user.id)
    .single();

  // Check if display_name and full_name are both present and not empty
  const hasDisplayName =
    profile?.display_name && profile.display_name.trim() !== "";
  const hasFullName = profile?.full_name && profile.full_name.trim() !== "";

  if (!hasDisplayName || !hasFullName) {
    // Profile is incomplete, redirect to complete-profile with returnTo
    const completeProfileUrl = returnTo
      ? `/complete-profile?returnTo=${encodeURIComponent(returnTo)}`
      : "/complete-profile";
    return completeProfileUrl;
  }

  return null; // Profile is complete
}