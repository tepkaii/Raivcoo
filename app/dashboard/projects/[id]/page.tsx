// app/dashboard/projects/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { AccessDeniedUI } from "./AccessDeniedUI";
import { checkProjectAccess } from "./lib/actions";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Dynamic metadata
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

// Main page component
export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = encodeURIComponent(`/dashboard/projects/${id}`);
    redirect(`/login?returnTo=${returnUrl}`);
  }

  // Get editor profile
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id, full_name, display_name, email, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Check project access using our RPC function
  const accessCheck = await checkProjectAccess(supabase, id);

  // If project doesn't exist, return 404
  if (!accessCheck.project_exists) {
    return notFound();
  }

  // If no access, show appropriate access denied UI
  if (!accessCheck.has_access) {
    return <AccessDeniedUI accessCheck={accessCheck} />;
  }

  // User has access - now get full project data
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/5 border-2 border-destructive/20">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            {/* Title and Message */}
            <div className="space-y-4 mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                Error Loading Project
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                There was an error loading the project data. Please try again.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild className="flex-1">
                <a href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
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

  // Add members and user role to project
  const projectWithMembers = {
    ...project,
    project_members: membersWithProfiles,
    user_role: accessCheck.role,
  };

  return (
    <div>
      <ProjectWorkspace
        project={projectWithMembers}
        authenticatedUser={authenticatedUser}
        isOwner={accessCheck.is_owner}
      />
    </div>
  );
}