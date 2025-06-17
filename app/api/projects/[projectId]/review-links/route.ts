// app/api/projects/[projectId]/review-links/route.ts
import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
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

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { mediaId, title } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "Media ID is required" },
        { status: 400 }
      );
    }

    // Verify media belongs to project
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Generate unique token
    const linkToken = nanoid(12);

    const { data: reviewLink, error: linkError } = await supabase
      .from("review_links")
      .insert({
        project_id: projectId,
        media_id: mediaId,
        link_token: linkToken,
        title: title?.trim() || null,
      })
      .select()
      .single();

    if (linkError) throw linkError;

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${linkToken}`;

    return NextResponse.json({
      message: "Review link created successfully",
      reviewLink: reviewLink,
      reviewUrl: reviewUrl,
    });
  } catch (error) {
    console.error("Create review link error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create review link",
      },
      { status: 500 }
    );
  }
}
