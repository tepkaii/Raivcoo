import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientDetailPage from "./ClientDetailPage";

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

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
  };
  project_tracks?: ProjectTrack[];
  latestTrack?: ProjectTrack | null;
  latestTrackUpdate?: string | null;
}

export default async function page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id: clientId } = await params;

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
    return redirect("/profile?error=Editor profile needed");
  }

  // Fetch client data
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select(`id, name, company, email, phone, notes`)
    .eq("id", clientId)
    .eq("editor_id", editorProfile.id)
    .single();

  if (clientError || !clientData) {
    return redirect("/dashboard/clients?error=Client not found");
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
        client_id,
        client:clients(id, name),
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
      .eq("client_id", clientId)
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

  return <ClientDetailPage client={clientData} projects={projects} />;
}