// app/dashboard/projects/[id]/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { AccessDeniedUI } from "./components/TeamManagement/AccessDeniedUI";
import { checkProjectAccess } from "./lib/GeneralActions";
import { getFoldersAction } from "./lib/FolderActions";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        status,
        display_order,
        thumbnail_r2_url,
        thumbnail_r2_key,
        thumbnail_generated_at,
        folder_id
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
                <Link href={`/dashboard/projects/${id}`}>
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

  // Get folders data
  const foldersResult = await getFoldersAction(id);
  const folders = foldersResult.success ? foldersResult.folders : [];

  // Get ALL media files for the project to populate folder thumbnails
  const allProjectMedia = project.project_media || [];

  // Process folders with media information for thumbnails
  const processedFolders = folders.map((folder) => {
    const folderMedia = allProjectMedia.filter(
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

  // Filter project media to only show root-level media (no folder_id or null folder_id)
  const rootLevelMedia = allProjectMedia
    .filter((media) => !media.folder_id)
    .map((media) => ({
      ...media,
      display_order: media.display_order ?? media.version_number,
    }));

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

  // Add members, enhanced folders, and user role to project with root-level media only
  const projectWithMembers = {
    ...project,
    project_media: rootLevelMedia, // Only root-level media for main project view
    project_members: membersWithProfiles,
    project_folders: processedFolders, // Enhanced folders with media data
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