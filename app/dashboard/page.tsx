// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MainProjectsList } from "./components/MainProjects/MainProjectsList";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreateProjectDialog } from "./components/MainProjects/CreateProjectDialog";
import { createProject } from "./lib/actions";

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
    const returnUrl = encodeURIComponent("/dashboard");
    redirect(`/login?returnTo=${returnUrl}`);
  }

  // Get editor profile
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/account");
  }

  // Get subscription info
  const { data: subscription } = await supabase
    .from("subscriptions")
    // app/dashboard/page.tsx (continued)
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Determine if user has active subscription
  const hasActiveSubscription =
    subscription &&
    subscription.status === "active" &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > new Date();

  // Get plan limits - only free plan has limits
  const planLimits = getPlanLimits(
    subscription?.plan_id,
    hasActiveSubscription
  );

  // Get projects where user is owner OR accepted member - ✅ INCLUDE THUMBNAIL FIELDS
  const { data: ownedProjects, error: ownedError } = await supabase
    .from("projects")
    .select(
      `
    id,
    name,
    description,
    created_at,
    updated_at,
    editor_id,
    notifications_enabled,
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
      thumbnail_r2_url,
      thumbnail_r2_key,
      thumbnail_generated_at
    )
  `
    )
    .eq("editor_id", editorProfile.id)
    .order("updated_at", { ascending: false });

  // Get projects where user is an accepted member - ✅ INCLUDE THUMBNAIL FIELDS
  const { data: memberProjects, error: memberError } = await supabase
    .from("projects")
    .select(
      `
    id,
    name,
    description,
    created_at,
    updated_at,
    editor_id,
    notifications_enabled,
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
      thumbnail_r2_url,
      thumbnail_r2_key,
      thumbnail_generated_at
    ),
    project_members!inner (
      user_id,
      role,
      status,
      notifications_enabled
    )
  `
    )
    .eq("project_members.user_id", user.id)
    .eq("project_members.status", "accepted")
    .order("updated_at", { ascending: false });

  if (ownedError || memberError) {
    console.error("Error fetching projects:", ownedError || memberError);
  }

  // Combine and deduplicate projects
  const allProjects = [
    ...(ownedProjects || []).map((project) => ({
      ...project,
      isOwner: true,
      userRole: "owner" as const,
      memberNotificationsEnabled: undefined,
    })),
    ...(memberProjects || []).map((project) => ({
      ...project,
      isOwner: false,
      userRole: project.project_members[0]?.role as
        | "viewer"
        | "reviewer"
        | "collaborator",
      memberNotificationsEnabled:
        project.project_members[0]?.notifications_enabled,
    })),
  ];

  // Remove duplicates
  const uniqueProjects = allProjects.filter(
    (project, index, self) =>
      index === self.findIndex((p) => p.id === project.id)
  );

  // Sort by updated_at
  uniqueProjects.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Process projects data
  const processedProjects = uniqueProjects.map((project) => {
    const allMediaFiles = project.project_media || [];

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
      project_media: parentMedia,
      stats: {
        totalFiles,
        totalSize,
        videoCount,
        imageCount,
        lastUpload,
      },
    };
  });

  // Calculate owned project count
  const ownedProjectCount = processedProjects.filter((p) => p.isOwner).length;

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 ">
        <div className="flex items-center h-full">
          <SidebarTrigger />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <h1 className="text-xl ml-4 mr-4">
              {editorProfile.full_name}'s Projects
            </h1>
          </div>
        </div>

        <CreateProjectDialog
          createProjectAction={createProject}
          currentProjectCount={ownedProjectCount}
          planLimits={planLimits}
          subscription={subscription}
        />
      </header>

      {/* MainProjectsList */}
      <MainProjectsList
        projects={processedProjects}
        currentUserId={editorProfile.id}
      />
    </div>
  );
}

// Helper function to get plan limits - only free plan has limits
function getPlanLimits(planId: string | null, hasActiveSubscription: boolean) {
  // If no active subscription or free plan, apply free limits
  if (!hasActiveSubscription || !planId || planId === "free") {

    
    return {
      maxProjects: 2,
      planName: "Free",
      isActive: false,
      hasLimit: true,
    };
  }

  // Both lite and pro have unlimited projects
  switch (planId) {
    case "lite":
      return {
        maxProjects: -1, // unlimited
        planName: "Lite",
        isActive: true,
        hasLimit: false,
      };
    case "pro":
      return {
        maxProjects: -1, // unlimited
        planName: "Pro",
        isActive: true,
        hasLimit: false,
      };
    default:
      return {
        maxProjects: 2,
        planName: "Free",
        isActive: false,
        hasLimit: true,
      };
  }
}