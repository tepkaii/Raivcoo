import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { MemberRemovedEmail } from "@/app/components/emails/Members/MemberRemovedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Get editor profile (project owner)
    const { data: editorProfile } = await supabase
      .from("editor_profiles")
      .select("id, full_name, display_name, email")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return NextResponse.json(
        { error: "Editor profile not found" },
        { status: 404 }
      );
    }

    // Verify project ownership and get project details
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 🔥 FIXED: Get member details with proper join
    const { data: memberData, error: memberFetchError } = await supabase
      .from("project_members")
      .select(
        `
        id,
        user_id,
        role,
        status
      `
      )
      .eq("id", memberId)
      .eq("project_id", projectId)
      .single();

    if (memberFetchError || !memberData) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 🔥 FIXED: Get the member's profile separately using their user_id
    const { data: memberProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("full_name, display_name, email, user_id")
      .eq("user_id", memberData.user_id)
      .single();

    if (profileError || !memberProfile) {
      console.log("❌ Member profile not found:", profileError);
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    const memberName =
      memberProfile.display_name ||
      memberProfile.full_name ||
      memberProfile.email;
    const ownerName =
      editorProfile.display_name ||
      editorProfile.full_name ||
      editorProfile.email;

    // REMOVE THE MEMBER FROM PROJECT
    const { error: deleteError } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (deleteError) {
      console.log("❌ Failed to remove member:", deleteError);
      throw deleteError;
    }

    // 🔥 CHECK IF WE SHOULD SEND EMAIL NOTIFICATION
    const shouldSendEmail = memberData.status === "accepted";

    if (shouldSendEmail) {
      try {
        const removedAt = new Date().toISOString();

        const { data: emailData, error: emailError } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL!,
            to: [memberProfile.email],
            subject: `You have been removed from ${project.name}`,
            react: MemberRemovedEmail({
              memberName,
              memberEmail: memberProfile.email,
              projectName: project.name,
              ownerName,
              removedAt,
              role: memberData.role as any,
            }),
          }
        );

        if (emailError) {
          console.error("❌ Error sending member removal email:", emailError);
        } else {
        }
      } catch (emailError) {
        console.error("❌ Failed to send member removal email:", emailError);
      }
    } else {
    }

    // Activity notification for owner
    try {
      const { error: activityError } = await supabase
        .from("activity_notifications")
        .insert({
          user_id: user.id,
          project_id: projectId,
          title: `Removed ${memberName} from project`,
          description: `You removed ${memberName} (${memberData.status}) from ${project.name}`,
          actor_id: user.id,
          actor_name: ownerName,
          activity_data: {
            type: "member_removed",
            removed_member_name: memberName,
            removed_member_email: memberProfile.email,
            removed_member_role: memberData.role,
            removed_member_status: memberData.status,
            project_name: project.name,
            email_sent: shouldSendEmail,
          },
        });

      if (activityError) {
        console.error(
          "❌ Error creating activity notification:",
          activityError
        );
      } else {
      }
    } catch (activityError) {
      console.error(
        "❌ Failed to create activity notification:",
        activityError
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${memberName} from ${project.name}`,
      emailSent: shouldSendEmail,
    });
  } catch (error) {
    console.error("❌ Remove member error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove member",
      },
      { status: 500 }
    );
  }
}
