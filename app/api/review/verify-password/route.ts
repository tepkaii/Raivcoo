// app/api/review/verify-password/route.ts
import { createClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get review link
    const { data: reviewLink, error } = await supabase
      .from("review_links")
      .select("password_hash, requires_password, is_active")
      .eq("link_token", token)
      .eq("is_active", true)
      .single();

    if (error || !reviewLink) {
      return NextResponse.json(
        { error: "Review link not found" },
        { status: 404 }
      );
    }

    if (!reviewLink.requires_password) {
      return NextResponse.json({ success: true });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      reviewLink.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error:
            "Incorrect password. Please check your password and try again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
