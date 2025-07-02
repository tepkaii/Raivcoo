// app/dashboard/projects/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { Metadata } from "next";

// Define types
type ProjectRole = "viewer" | "reviewer" | "collaborator";

interface ProjectMember {
  id: string;
  user_id: string;
  role: ProjectRole;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  joined_at?: string;
  user_profile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

// Dynamic metadata - simplified for debug
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return {
    title: "Project Workspace",
    description: "Project workspace for media review and collaboration",
  };
}

// Dynamic page
export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  console.log("🔍 DEBUG: Project ID:", id);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  console.log("🔍 DEBUG: Current user ID:", user.id);

  // Get editor profile
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id, full_name, display_name, email, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    console.log("🔍 DEBUG: Editor profile error:", profileError);
    redirect("/account");
  }

  console.log("🔍 DEBUG: Editor profile:", editorProfile);

  // Get project with all data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      created_at,
      editor_id,
      project_references,
      project_media (
        id,
        filename,
        original_filename,
        file_type,
        mime_type,
        file_size,
        r2_url,
        uploaded_at,
        parent_media_id,
        version_number,
        is_current_version,
        version_name,
        status
      ),
      review_links (
        id,
        link_token,
        title,
        is_active,
        created_at,
        expires_at,
        media_id,
        requires_password,
        allow_download
      ),
      project_members (
        id,
        user_id,
        role,
        status,
        invited_at,
        joined_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (projectError || !project) {
    console.log("🔍 DEBUG: Project error:", projectError);
    return notFound();
  }

  console.log("🔍 DEBUG: Project found:", {
    id: project.id,
    name: project.name,
    editor_id: project.editor_id,
    members_count: project.project_members?.length || 0,
  });

  // Check access
  const isOwner = project.editor_id === editorProfile.id;
  console.log("🔍 DEBUG: Is owner?", isOwner);

  const userMembership = project.project_members?.find(
    (m) => m.user_id === user.id
  );
  console.log("🔍 DEBUG: User membership:", userMembership);

  console.log("🔍 DEBUG: All project members:", project.project_members);

  // ✅ RELAXED ACCESS CHECK FOR DEBUG
  const hasAccess =
    isOwner || (userMembership && userMembership.status === "accepted");
  console.log("🔍 DEBUG: Has access?", hasAccess);

  if (!hasAccess) {
    console.log("🔍 DEBUG: ACCESS DENIED - redirecting to notFound");
    return (
      <div className="p-8">
        <h1>Debug Info</h1>
        <pre>
          {JSON.stringify(
            {
              userId: user.id,
              editorId: editorProfile.id,
              projectOwnerId: project.editor_id,
              isOwner,
              userMembership,
              allMembers: project.project_members,
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  // Create authenticated user object
  const authenticatedUser = {
    id: user.id,
    email: editorProfile.email || user.email || "",
    name:
      editorProfile.display_name || editorProfile.full_name || user.email || "",
    avatar_url: editorProfile.avatar_url || null,
  };

  // Get user profiles for all members
  const memberUserIds = project.project_members?.map((m) => m.user_id) || [];
  const { data: userProfiles } = await supabase
    .from("editor_profiles")
    .select("user_id, full_name, display_name, email, avatar_url")
    .in("user_id", memberUserIds);

  // Combine member data with user profiles
  const membersWithProfiles: ProjectMember[] =
    project.project_members?.map((member) => {
      const profile = userProfiles?.find((p) => p.user_id === member.user_id);
      return {
        ...member,
        user_profile: profile
          ? {
              email: profile.email || "",
              name:
                profile.display_name ||
                profile.full_name ||
                profile.email ||
                "Unknown",
              avatar_url: profile.avatar_url || undefined,
            }
          : undefined,
      };
    }) || [];

  // Determine user's role
  const userRole: ProjectRole | null = isOwner
    ? "collaborator"
    : userMembership?.role || null;

  console.log("🔍 DEBUG: User role:", userRole);

  // Add members and user role to project
  const projectWithMembers = {
    ...project,
    project_members: membersWithProfiles,
    user_role: userRole,
  };

  return (
    <div>
      <ProjectWorkspace
        project={projectWithMembers}
        authenticatedUser={authenticatedUser}
        isOwner={isOwner}
      />
    </div>
  );
}
