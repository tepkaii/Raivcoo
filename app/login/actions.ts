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

  // Redirect to returnTo URL if provided, otherwise go to home
  const redirectUrl = returnTo ? decodeURIComponent(returnTo) : "/";
  redirect(redirectUrl);
}