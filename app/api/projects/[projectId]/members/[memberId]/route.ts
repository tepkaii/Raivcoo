// app/api/projects/[projectId]/members/[memberId]/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId, memberId } = await params;
    const { role } = await request.json();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update member role
    const { error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update member role error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update role",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId, memberId } = await params;

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove member
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove member",
      },
      { status: 500 }
    );
  }
}
