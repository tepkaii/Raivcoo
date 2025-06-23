// app/dashboard/projects/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsList } from "./projects/ProjectsList";
import { Metadata } from "next";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects | Dashboard",
  description: "Manage all your video editing projects and workspaces.",
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id , full_name")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Get all projects with media data (limit first 4 for thumbnails)
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      created_at,
      updated_at,
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
      )
    `
    )
    .eq("editor_id", editorProfile.id)
    .order("updated_at", { ascending: false });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
  }

  // Process projects data to include stats and limit media for thumbnails
  const processedProjects = (projects || []).map((project) => {
    const allMediaFiles = project.project_media || [];

    // Get only parent media (not versions) for thumbnails, limit to 4
    const parentMedia = allMediaFiles
      .filter((file) => !file.parent_media_id)
      .sort(
        (a, b) =>
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      )
      .slice(0, 4);

    const totalFiles = allMediaFiles.length;
    const totalSize = allMediaFiles.reduce(
      (sum, file) => sum + (file.file_size || 0),
      0
    );
    const videoCount = allMediaFiles.filter(
      (file) => file.file_type === "video"
    ).length;
    const imageCount = allMediaFiles.filter(
      (file) => file.file_type === "image"
    ).length;
    const lastUpload =
      allMediaFiles.length > 0
        ? allMediaFiles.sort(
            (a, b) =>
              new Date(b.uploaded_at).getTime() -
              new Date(a.uploaded_at).getTime()
          )[0].uploaded_at
        : null;

    return {
      ...project,
      project_media: parentMedia, // Only first 4 for thumbnails
      stats: {
        totalFiles,
        totalSize,
        videoCount,
        imageCount,
        lastUpload,
      },
    };
  });

  return (
    <header className="min-h-screen  space-y-6">
      {/* Header */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="border-r flex items-center h-full">
          <h1 className="text-xl mr-4">{editorProfile.full_name}'s Projects</h1>
        </div>
        <Link href="/dashboard/projects/new">
          <RevButtons className="gap-2" size={"sm"}>
            <Plus className="h-4 w-4" />
            New Project
          </RevButtons>
        </Link>
      </header>

      {/* Projects List */}
      <ProjectsList projects={processedProjects} />
    </header>
  );
}
