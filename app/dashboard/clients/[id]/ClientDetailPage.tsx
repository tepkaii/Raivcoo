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
  Clapperboard,
  Link2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { ClientDetailActions } from "./components/client/ClientDetailActions";
import {
  ProjectActionsDropdown,
  type ProjectDataForActions,
} from "./components/project/ProjectActionsDropdown";

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

export default function ClientDetailPage({
  client,
  projects,
}: {
  client: ClientData;
  projects: ProjectWithTracksForClientPage[];
}) {
  return (
    <div className="min-h-screen py-6 space-y-8">
      <Link
        href="/dashboard/clients"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-2 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Clients
      </Link>

      {/* Header with Client Name AND Client Actions Component */}
      <div className="flex justify-between items-center gap-4 flex-wrap border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            {client.name}
          </h1>
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
            <Clapperboard className="h-6 w-6" /> Projects ({projects.length})
          </h2>

          {projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => {
                const latestRound =
                  project.project_tracks?.length > 0
                    ? Math.max(
                        ...project.project_tracks.map((t) => t.round_number)
                      )
                    : 0;

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
                    className="relative group overflow-hidden rounded-md"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-${
                        statusVariant === "default" ? "primary" : statusVariant
                      }`}
                    />

                    <div className="flex">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="flex-1 min-w-0 hover:bg-muted/10 transition-colors"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start">
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
                              </div>

                              <div className="flex items-center gap-2 mt-2 mb-3">
                                <Badge
                                  variant={statusVariant}
                                  className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {statusIcon}
                                  {formatStatus(project.status)}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                                {project.description || (
                                  <span className="italic">
                                    No description provided
                                  </span>
                                )}
                              </p>

                              <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/50 text-xs flex-wrap gap-y-2">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      {formatDate(project.created_at)}
                                    </span>
                                  </div>

                                  {project.deadline && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>
                                        {formatDate(project.deadline)}
                                      </span>
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

                      <div
                        className="p-2 flex items-center"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <ProjectActionsDropdown project={projectForActions} />
                      </div>
                    </div>
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
