// app/dashboard/projects/[id]/folders/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { FolderManagement } from "./FolderManagement";
import { AccessDeniedUI } from "../components/TeamManagement/AccessDeniedUI";
import { checkProjectAccess } from "../lib/GeneralActions";
import { getFoldersAction } from "../lib/FolderActions";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return {
    title: "Folders | Project Workspace",
    description: "Manage project folders and organization",
  };
}

// Main page component
export default async function FoldersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id: projectId } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = encodeURIComponent(
      `/dashboard/projects/${projectId}/folders`
    );
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
  const accessCheck = await checkProjectAccess(supabase, projectId);

  // If project doesn't exist, return 404
  if (!accessCheck.project_exists) {
    return notFound();
  }

  // If no access, show appropriate access denied UI
  if (!accessCheck.has_access) {
    return <AccessDeniedUI accessCheck={accessCheck} />;
  }

  // User has access - now get project data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, editor_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("Project error:", projectError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/5 border-2 border-destructive/20">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                Error Loading Project
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                There was an error loading the project data. Please try again.
              </p>
              {projectError && (
                <p className="text-xs text-red-500 font-mono">
                  {projectError.message}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/dashboard/projects/${projectId}/folders`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get folders data with media information
  const foldersResult = await getFoldersAction(projectId);
  const folders = foldersResult.success ? foldersResult.folders : [];

  // Get media files for each folder to create thumbnails
  const { data: allMedia } = await supabase
    .from("project_media")
    .select(
      `
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
      thumbnail_r2_url,
      thumbnail_r2_key,
      thumbnail_generated_at,
      folder_id
    `
    )
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });

  // Process folders with media information
  const processedFolders = folders.map((folder) => {
    const folderMedia = (allMedia || []).filter(
      (media) => media.folder_id === folder.id
    );

    // Get first 4 media files for thumbnail display
    const displayMedia = folderMedia
      .filter((file) => !file.parent_media_id) // Only parent media
      .slice(0, 4);

    const totalFiles = folderMedia.length;
    const totalSize = folderMedia.reduce(
      (sum, file) => sum + (file.file_size || 0),
      0
    );
    const videoCount = folderMedia.filter(
      (file) => file.file_type === "video"
    ).length;
    const imageCount = folderMedia.filter(
      (file) => file.file_type === "image"
    ).length;
    const lastUpload =
      folderMedia.length > 0
        ? folderMedia.sort(
            (a, b) =>
              new Date(b.uploaded_at).getTime() -
              new Date(a.uploaded_at).getTime()
          )[0].uploaded_at
        : null;

    return {
      ...folder,
      media_files: displayMedia,
      stats: {
        totalFiles,
        totalSize,
        videoCount,
        imageCount,
        lastUpload,
      },
    };
  });

  // Create authenticated user object
  const authenticatedUser = {
    id: user.id,
    email: editorProfile.email || user.email || "",
    name:
      editorProfile.display_name || editorProfile.full_name || user.email || "",
    avatar_url: editorProfile.avatar_url || null,
  };

  return (
    <FolderManagement
      projectId={projectId}
      projectName={project.name}
      folders={processedFolders}
      userRole={accessCheck.role}
      isOwner={accessCheck.is_owner}
      authenticatedUser={authenticatedUser}
    />
  );
}
