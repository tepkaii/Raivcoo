// app/auth/callback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const setPasswordParam = requestUrl.searchParams.get("set_password");
  const returnTo = requestUrl.searchParams.get("returnTo");

  const supabase = await createClient();

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error}`);
  }

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);

      // Only redirect to set-password if explicitly requested via parameter
      if (setPasswordParam === "true") {
        return NextResponse.redirect(
          new URL("/set-password", requestUrl.origin)
        );
      }

      // After successful OAuth (both login and signup), check if profile is complete
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a complete profile
        const { data: profile } = await supabase
          .from("editor_profiles")
          .select("display_name, full_name")
          .eq("user_id", user.id)
          .single();

        // Check if display_name and full_name are both present and not empty
        const hasDisplayName =
          profile?.display_name && profile.display_name.trim() !== "";
        const hasFullName =
          profile?.full_name && profile.full_name.trim() !== "";

        if (!hasDisplayName || !hasFullName) {
          // Profile is incomplete, redirect to complete-profile with returnTo
          const completeProfileUrl = returnTo
            ? `/complete-profile?returnTo=${encodeURIComponent(returnTo)}`
            : "/complete-profile";
          return NextResponse.redirect(
            new URL(completeProfileUrl, requestUrl.origin)
          );
        }
      }
    } catch (e) {
      console.error("Failed to exchange OAuth code:", e);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed`
      );
    }
  }

  // Profile is complete, redirect to intended destination
  const redirectUrl = returnTo ? decodeURIComponent(returnTo) : "/";
  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}