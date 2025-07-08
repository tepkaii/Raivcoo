// app/api/projects/[projectId]/invite/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { ProjectInvitationEmail } from "../../../../components/emails/Members/ProjectInvitationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to create activity notification
async function createActivityNotification(params: {
  userId: string;
  projectId: string;
  activityType: string;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  activityData: any;
}) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("activity_notifications").insert({
      user_id: params.userId,
      project_id: params.projectId,
      title: params.title,
      description: params.description,
      actor_id: params.actorId,
      actor_name: params.actorName,
      activity_data: {
        type: params.activityType,
        ...params.activityData,
      },
    });

    if (error) {
      console.error("❌ Error creating activity notification:", error);
    } else {
    }
  } catch (error) {
    console.error("❌ Failed to create activity notification:", error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;
    const { email, role } = await request.json();

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
      .select("id, full_name, display_name, email")
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
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 403 }
      );
    }

    // Check if user exists by looking in editor_profiles
    const { data: existingEditor } = await supabase
      .from("editor_profiles")
      .select("user_id, email, full_name, display_name")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Check if already a member (if user exists)
    if (existingEditor) {
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingEditor.user_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 }
        );
      }
    }

    const inviterName =
      editorProfile.display_name ||
      editorProfile.full_name ||
      editorProfile.email;

    if (existingEditor) {
      // User exists, add them directly to project_members
      const { data: member, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingEditor.user_id,
          role,
          invited_by: editorProfile.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Create invitation token for acceptance URL
      const invitationToken = nanoid(32);

      // Store token temporarily for the acceptance flow
      const { error: tokenError } = await supabase
        .from("project_invitations")
        .insert({
          project_id: projectId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: editorProfile.id,
          invitation_token: invitationToken,
        });

      if (tokenError) {
        console.error("Error storing invitation token:", tokenError);
        // Continue anyway since the member was created
      }

      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/accept/${invitationToken}`;

      // 🔥 CREATE ACTIVITY NOTIFICATION FOR INVITEE
      await createActivityNotification({
        userId: existingEditor.user_id,
        projectId: projectId,
        activityType: "invitation_received",
        title: `${inviterName} invited you to ${project.name} via email`,
        description: `You've been invited to join "${project.name}" as a ${role}`,
        actorId: user.id,
        actorName: inviterName,
        activityData: {
          role,
          project_name: project.name,
          inviter_email: editorProfile.email,
          invitation_token: invitationToken,
          invite_url: inviteUrl,
        },
      });

      // Send email to existing user
      try {
        const { data: emailData, error: emailError } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL!,
            to: [email],
            subject: `You're invited to collaborate on ${project.name}`,
            react: ProjectInvitationEmail({
              inviterName,
              inviterEmail: editorProfile.email,
              projectName: project.name,
              role,
              inviteUrl,
              recipientEmail: email,
            }),
          }
        );

        if (emailError) {
          console.error("Error sending email:", emailError);
          // Don't fail the request if email fails
        }
      } catch (emailError) {
        console.error("Resend error:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        member,
        message: "User invited successfully and email sent",
      });
    } else {
      // User doesn't exist, create invitation
      const invitationToken = nanoid(32);

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("project_invitations")
        .select("id")
        .eq("project_id", projectId)
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingInvitation) {
        return NextResponse.json(
          { error: "Invitation already sent to this email" },
          { status: 400 }
        );
      }

      const { data: invitation, error } = await supabase
        .from("project_invitations")
        .insert({
          project_id: projectId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: editorProfile.id,
          invitation_token: invitationToken,
        })
        .select()
        .single();

      if (error) throw error;

      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/accept/${invitationToken}`;

      // Send email to new user
      try {
        const { data: emailData, error: emailError } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL!,
            to: [email],
            subject: `You're invited to collaborate on ${project.name}`,
            react: ProjectInvitationEmail({
              inviterName,
              inviterEmail: editorProfile.email,
              projectName: project.name,
              role,
              inviteUrl,
              recipientEmail: email,
            }),
          }
        );

        if (emailError) {
          console.error("Error sending email:", emailError);
          // Don't fail the request if email fails
        }
      } catch (emailError) {
        console.error("Resend error:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        invitation,
        inviteUrl,
        message: "Invitation sent successfully",
      });
    }
  } catch (error) {
    console.error("Invite user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to invite user",
      },
      { status: 500 }
    );
  }
}