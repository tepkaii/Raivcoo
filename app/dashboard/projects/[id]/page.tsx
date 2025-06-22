// app/dashboard/projects/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectWorkspace } from "./ProjectWorkspace";

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

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Get project with media files and review links
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
        version_name
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
      <ProjectWorkspace project={project} />
    </div>
  );
}