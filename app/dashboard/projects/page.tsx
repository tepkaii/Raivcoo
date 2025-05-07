// app/dashboard/projects/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AllProjectsPageClient from "./components/AllProjectsPageClient";
import { Metadata } from "next";

interface Step {
  name: string;
  status: "pending" | "completed";
  is_final?: boolean;
  deliverable_link?: string;
  metadata?: {
    text?: string;
    type?: string;
    links?: any[];
    images?: string[];
    created_at?: string;
    step_index?: number;
  };
}

interface ProjectTrack {
  id: string;
  round_number: number;
  status: string;
  client_decision: string;
  steps: Step[];
  created_at: string;
  updated_at: string;
}

// Updated Project interface with client fields directly in project
interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  client_email?: string;
  password_protected: boolean;
  project_tracks?: ProjectTrack[];
  latestTrack?: ProjectTrack | null;
  latestTrackUpdate?: string | null;
}

// --- Metadata ---
export const metadata: Metadata = {
  title: "All Projects | Raivcoo",
  description: "View and manage all your video editing projects.",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login?message=Please log in.");
  }

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    return redirect("/account?error=Editor Account needed");
  }

  // Fetch projects with additional data needed for the new UI
  let projects: Project[] = [];
  try {
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select(
        `
        id, 
        title,
        description,
        status,
        deadline,
        created_at,
        updated_at,
        client_name,
        client_email,
        password_protected,
        project_tracks(
          id, 
          round_number, 
          status, 
          client_decision,
          steps,
          created_at, 
          updated_at
        )
      `
      )
      .eq("editor_id", editorProfile.id)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error(`Error fetching projects:`, projectsError);
      throw new Error("Failed to load projects");
    }

    // Process projects to find latest track for each
    projects = (projectsData || []).map((project) => {
      const latestTrack =
        project.project_tracks?.length > 0
          ? [...project.project_tracks].sort((a, b) => {
              // Use updated_at if available, otherwise created_at
              const timestampA = new Date(
                a.updated_at && a.updated_at !== a.created_at
                  ? a.updated_at
                  : a.created_at
              ).getTime();

              const timestampB = new Date(
                b.updated_at && b.updated_at !== b.created_at
                  ? b.updated_at
                  : b.created_at
              ).getTime();

              return timestampB - timestampA;
            })[0]
          : null;

      return {
        ...project,
        latestTrack,
        latestTrackUpdate:
          latestTrack?.updated_at || latestTrack?.created_at || null,
      };
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    throw err;
  }

  return <AllProjectsPageClient initialProjects={projects} />;
}