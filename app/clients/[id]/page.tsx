"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Clipboard,
  ArrowLeft,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  CircleDot,
  Video,
  Clapperboard,
  FileVideo,
  Scissors,
  Camera,
  Music,
  Upload,
  Download,
  Link2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { ClientDetailActions } from "./ClientDetailActions";
import {
  ProjectActionsDropdown,
  type ProjectDataForActions,
} from "./ProjectActionsDropdown";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface PageProps {
  params: { id: string };
}

type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type ProjectWithTracksForClientPage = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  deadline: string | null;
  created_at: string;
  project_tracks: { round_number: number }[] | null;
};

export default function ClientDetailPageClient({ params }: PageProps) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [projects, setProjects] = useState<
    ProjectWithTracksForClientPage[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { id: clientId } = params;

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
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select(`id, name, company, email, phone, notes`)
          .eq("id", clientId)
          .eq("editor_id", editorProfile.id)
          .single();

        if (clientError || !clientData) {
          setError("Client not found.");
          return;
        }

        setClient(clientData);

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(
            `id, title, description, status, deadline, created_at, project_tracks ( round_number )`
          )
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });

        if (projectsError) {
          console.error(`Error fetching projects:`, projectsError);
        }

        setProjects(projectsData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !client) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8 mt-24">
      <Link
        href="/clients"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-2 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Clients
      </Link>

      {/* Header with Client Name AND Client Actions Component */}
      <div className="flex justify-between items-center gap-4 flex-wrap border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          {client.company && (
            <p className="text-lg text-muted-foreground">{client.company}</p>
          )}
        </div>
        <ClientDetailActions client={client} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:underline break-all"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {!client.email && !client.phone && (
                <p className="text-sm text-muted-foreground italic">
                  No contact details.
                </p>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clipboard className="h-5 w-5" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-line break-words prose dark:prose-invert prose-sm max-w-none">
                  {client.notes}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder if no contact/notes */}
          {!client.notes && !client.email && !client.phone && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No additional details provided.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clapperboard className="h-6 w-6" /> Projects (
            {projects?.length ?? 0})
          </h2>

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
                const projectIcon = getProjectIcon(project.title);
                const liveTrackUrl = `/projects/${project.id}/live-track`;

                return (
                  <Card
                    key={project.id}
                    className="relative group overflow-hidden transition-all duration-200 hover:shadow-lg border-muted/80 hover:border-primary/20 bg-gradient-to-br from-background to-background/50"
                  >
                    {/* Status indicator line */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-${
                        statusVariant === "default" ? "primary" : statusVariant
                      }`}
                    />

                    <Link href={`/projects/${project.id}`} className="block">
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

                              {/* PROJECT Actions Dropdown - Now aligned with title */}
                              <ProjectActionsDropdown
                                project={projectForActions}
                              />
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
                                    // You could add a toast notification here
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
          ) : projects ? (
            <Card className="border-destructive">
              <CardContent className="text-center py-6 text-destructive">
                Error loading projects.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clapperboard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3>No projects found</h3>
                <p className="text-muted-foreground max-w-xs">
                  Create the first project for this client.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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

// New function to determine project icon based on title or other factors
function getProjectIcon(title: string) {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("edit") || titleLower.includes("cut")) {
    return <Scissors className="h-5 w-5" />;
  } else if (
    titleLower.includes("film") ||
    titleLower.includes("shoot") ||
    titleLower.includes("camera")
  ) {
    return <Camera className="h-5 w-5" />;
  } else if (
    titleLower.includes("music") ||
    titleLower.includes("audio") ||
    titleLower.includes("sound")
  ) {
    return <Music className="h-5 w-5" />;
  } else if (titleLower.includes("upload") || titleLower.includes("export")) {
    return <Upload className="h-5 w-5" />;
  } else if (titleLower.includes("download") || titleLower.includes("import")) {
    return <Download className="h-5 w-5" />;
  } else if (titleLower.includes("trailer") || titleLower.includes("teaser")) {
    return <FileVideo className="h-5 w-5" />;
  } else {
    return <Video className="h-5 w-5" />;
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
