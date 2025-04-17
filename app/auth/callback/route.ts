import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  const supabase = createClient();

  if (error) {
    console.error("OAuth error:", error);
    // You can redirect to an error page if you want
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error}`);
  }

  if (code) {
    try {
      await (await supabase).auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error("Failed to exchange OAuth code:", e);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed`
      );
    }
  }

  // After login complete (whether OAuth or normal session) → redirect to homepage
  return NextResponse.redirect(requestUrl.origin);
}
