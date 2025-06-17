// app/dashboard/projects/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsList } from "./ProjectsList";
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
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Get all projects with media count
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
        file_type,
        file_size,
        uploaded_at
      )
    `
    )
    .eq("editor_id", editorProfile.id)
    .order("updated_at", { ascending: false });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
  }

  // Process projects data to include stats
  const processedProjects = (projects || []).map((project) => {
    const mediaFiles = project.project_media || [];
    const totalFiles = mediaFiles.length;
    const totalSize = mediaFiles.reduce(
      (sum, file) => sum + (file.file_size || 0),
      0
    );
    const videoCount = mediaFiles.filter(
      (file) => file.file_type === "video"
    ).length;
    const imageCount = mediaFiles.filter(
      (file) => file.file_type === "image"
    ).length;
    const lastUpload =
      mediaFiles.length > 0
        ? mediaFiles.sort(
            (a, b) =>
              new Date(b.uploaded_at).getTime() -
              new Date(a.uploaded_at).getTime()
          )[0].uploaded_at
        : null;

    return {
      ...project,
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
    <div className="min-h-screen py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your video editing projects and workspaces.
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <RevButtons className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </RevButtons>
        </Link>
      </div>

      {/* Projects List */}
      <ProjectsList projects={processedProjects} />
    </div>
  );
}
