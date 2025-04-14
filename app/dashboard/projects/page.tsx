"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  CircleDot,
  Clapperboard,
  Link2,
  Copy,
} from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import {
  ProjectActionsDropdown,
  ProjectDataForActions,
} from "../clients/[id]/components/project/ProjectActionsDropdown";
import { RevButtons } from "@/components/ui/RevButtons";

type ProjectData = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  deadline: string | null;
  created_at: string;
  client_id: string;
  project_tracks: { round_number: number }[] | null;
};

export default function AllProjectsPageClient() {
  const [projects, setProjects] = useState<ProjectData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // --- Authentication & Authorization ---
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?message=Please log in.");
        return;
      }

      const { data: editorProfile, error: profileError } = await supabase
        .from("editor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !editorProfile) {
        router.push("/profile?error=Editor profile needed");
        return;
      }

      // --- Data Fetching ---
      try {
        // Simplified query without client data
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
            client_id,
            project_tracks (round_number)
          `
          )
          .eq("editor_id", editorProfile.id)
          .order("created_at", { ascending: false });

        if (projectsError) {
          console.error(`Error fetching projects:`, projectsError);
          setError("Failed to load projects");
          return;
        }

        setProjects(projectsData);
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen py-6 space-y-8 ">
      <div className="flex justify-between items-center gap-4 flex-wrap border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            All Projects
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage your projects
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <RevButtons variant="success">New Project</RevButtons>
        </Link>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects && projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project) => {
              const latestRound =
                project.project_tracks?.length > 0
                  ? Math.max(
                      ...project.project_tracks.map((t) => t.round_number)
                    )
                  : 0;

              // Data for Project Actions
              const projectForActions: ProjectDataForActions = {
                id: project.id,
                title: project.title,
                description: project.description,
                deadline: project.deadline,
              };

              const statusIcon = getStatusIcon(project.status);
              const statusVariant = getStatusVariant(project.status);
              const liveTrackUrl = `/live-track/${project.id}`;

              return (
                <Card
                  key={project.id}
                  className="relative group overflow-hidden border-[2px] border-[#3F3F3F] bg-primary-foreground
"
                >
                  {/* Status indicator line */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-${
                      statusVariant === "default" ? "primary" : statusVariant
                    }`}
                  />

                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="block"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                {project.title}
                              </h3>
                              {latestRound > 0 && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 py-0 h-5"
                                >
                                  <Layers className="h-3 w-3" />
                                  <span>Round {latestRound}</span>
                                </Badge>
                              )}
                            </div>

                            {/* PROJECT Actions Dropdown */}
                            <ProjectActionsDropdown
                              project={projectForActions}
                            />
                          </div>

                          {/* Client link */}
                          <div className="mt-1 mb-2">
                            <Link
                              href={`/clients/${project.client_id}`}
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>View Client</span>
                            </Link>
                          </div>

                          {/* Status badge with icon */}
                          <div className="flex items-center gap-2 mt-2 mb-3">
                            <Badge
                              variant={statusVariant}
                              className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium"
                            >
                              {statusIcon}
                              {formatStatus(project.status)}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                            {project.description || (
                              <span className="italic">
                                No description provided
                              </span>
                            )}
                          </p>

                          {/* Footer with dates and action buttons */}
                          <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/50 text-xs flex-wrap gap-y-2">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(project.created_at)}</span>
                              </div>

                              {project.deadline && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatDate(project.deadline)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={liveTrackUrl}
                                className="p-1 rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                                title="Live Track Link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link2 className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">
                                  Live Link
                                </span>
                              </Link>
                              <button
                                className="p-1 rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                                title="Copy Live Track Link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}${liveTrackUrl}`
                                  );
                                }}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">
                                  Copy
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clapperboard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3>No projects found</h3>
              <p className="text-muted-foreground max-w-xs">
                Create your first project to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusIcon(status: string | null) {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "active":
    case "in_progress":
      return <CircleDot className="h-3 w-3" />;
    case "on_hold":
      return <PauseCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

function getStatusVariant(status: string | null): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "active":
    case "in_progress":
      return "info";
    case "on_hold":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}
