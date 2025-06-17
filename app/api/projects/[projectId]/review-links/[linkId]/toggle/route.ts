// app/api/review-links/[linkId]/toggle/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get editor profile
    const { data: editorProfile } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return NextResponse.json(
        { error: "Editor profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Verify review link ownership through project
    const { data: reviewLink, error: linkError } = await supabase
      .from("review_links")
      .select(
        `
        id,
        project:projects!inner(id, editor_id)
      `
      )
      .eq("id", linkId)
      .single();

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: "Review link not found" },
        { status: 404 }
      );
    }

    if (reviewLink.project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the review link status
    const { error: updateError } = await supabase
      .from("review_links")
      .update({ is_active: isActive })
      .eq("id", linkId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: `Review link ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Toggle review link error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update review link",
      },
      { status: 500 }
    );
  }
}
