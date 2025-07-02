// app/dashboard/projects/[id]/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { Metadata } from "next";

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  // Get user first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      title: "Login Required",
      description: "Please login to access this project workspace.",
    };
  }

  // Get editor profile
  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) {
    return {
      title: "Account Setup Required",
      description: "Please complete your account setup to access projects.",
    };
  }

  // Get ONLY basic project info - no media files
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, editor_id")
    .eq("id", id)
    .single();

  if (projectError || !project || project.editor_id !== editorProfile.id) {
    return {
      title: "Project Not Found",
      description:
        "The requested project could not be found or you don't have access to it.",
    };
  }

  const description =
    project.description ||
    "Project workspace for media review and collaboration";

  return {
    title: `${project.name} - Project Workspace`,
    description: description,
    openGraph: {
      title: `${project.name} - Project Workspace`,
      description: description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${project.name} - Project Workspace`,
      description: description,
    },
    robots: {
      index: false, // Don't index private project workspaces
      follow: false,
    },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get editor profile with additional fields for authenticated user data including avatar_url
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id, full_name, display_name, email, avatar_url") // ✅ ADD avatar_url
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Create authenticatedUser object matching the pattern from MediaInterface
  const authenticatedUser = {
    id: user.id,
    email: editorProfile.email || user.email || "",
    name:
      editorProfile.display_name || editorProfile.full_name || user.email || "",
    avatar_url: editorProfile.avatar_url || null, // ✅ ADD avatar_url
  };

  // Get project with media files and review links (full data for the component)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      created_at,
      editor_id,
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
        requires_password
      )
    `
    )
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return notFound();
  }

  if (project.editor_id !== editorProfile.id) {
    return notFound();
  }

  return (
    <div>
      <ProjectWorkspace
        project={project}
        authenticatedUser={authenticatedUser}
      />
    </div>
  );
}