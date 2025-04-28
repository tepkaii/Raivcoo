"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RevButtons } from "@/components/ui/RevButtons";
import { Progress } from "@/components/ui/progress";
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
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  FolderOpenDot,
  Truck,
  Circle,
} from "lucide-react";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";

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

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

export default function AllProjectsPageClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({ isOpen: false, project: null });

  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    projectId: string;
    projectTitle: string;
  }>({ isOpen: false, projectId: "", projectTitle: "" });

  const handleSelect = (event: Event) => event.preventDefault();

  // Calculate progress for a track
  const calculateTrackProgress = (track: ProjectTrack | undefined | null) => {
    if (!track || !track.steps?.length) return 0;
    const completedSteps = track.steps.filter(
      (step) => step.status === "completed"
    ).length;
    return Math.round((completedSteps / track.steps.length) * 100);
  };

  // Check if it's a new round (all steps pending)
  const isNewRound = (track: ProjectTrack | undefined | null) => {
    if (!track || !track.steps?.length) return false;
    return track.steps.every((step) => step.status === "pending");
  };

  return (
    <div className="min-h-screen py-6 space-y-8">
      {/* Dialogs */}
      {editDialogState.project && (
        <ProjectEditDialog
          project={editDialogState.project}
          isOpen={editDialogState.isOpen}
          setIsOpen={(isOpen) =>
            setEditDialogState({ ...editDialogState, isOpen })
          }
        />
      )}
      <ProjectDeleteDialog
        projectId={deleteDialogState.projectId}
        projectTitle={deleteDialogState.projectTitle}
        isOpen={deleteDialogState.isOpen}
        setIsOpen={(isOpen) =>
          setDeleteDialogState({ ...deleteDialogState, isOpen })
        }
      />

      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            All Projects
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage your projects
          </p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {initialProjects && initialProjects.length > 0 ? (
          <div className="grid gap-4">
            {initialProjects.map((project) => {
              const trackProgress = calculateTrackProgress(project.latestTrack);
              const newRound = isNewRound(project.latestTrack);
              const statusIcon = getStatusIcon(project.status);
              const statusVariant = getStatusVariant(project.status);
              const liveTrackUrl = `/live-track/${project.id}`;

              return (
                <Card
                  key={project.id}
                  className="relative group overflow-hidden border-[2px]"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      statusVariant === "default"
                        ? "bg-primary"
                        : `bg-${statusVariant}`
                    }`}
                  />

                  <CardContent className="p-5">
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="font-semibold text-lg truncate group-hover:text-primary transition-colors"
                            >
                              {project.title}
                            </Link>
                            {project.latestTrack?.round_number && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 py-0 h-5"
                              >
                                <Layers className="h-3 w-3" />
                                <span>
                                  Round {project.latestTrack.round_number}
                                </span>
                              </Badge>
                            )}
                          </div>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <RevButtons
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 data-[state=open]:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Project Actions</span>
                              </RevButtons>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  handleSelect(e);
                                  setEditDialogState({
                                    isOpen: true,
                                    project,
                                  });
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem onSelect={handleSelect} asChild>
                                <Link
                                  href={liveTrackUrl}
                                  className="flex items-center"
                                >
                                  <Truck className="mr-2 h-4 w-4" />
                                  <span>Live Track</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={(e) => {
                                  handleSelect(e);
                                  setDeleteDialogState({
                                    isOpen: true,
                                    projectId: project.id,
                                    projectTitle: project.title,
                                  });
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Project</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {project.client && (
                          <div className="mt-1 mb-2">
                            <Link
                              href={`/dashboard/clients/${project.client.id}`}
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                            >
                              <span>{project.client.name}</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

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

                        {/* Progress bar for projects with tracks */}
                        {project.latestTrack && (
                          <div className="space-y-2 mb-4">
                            <div className="flex w-full justify-between items-center">
                              <div className="flex w-full justify-between items-center gap-2">
                                <span className="text-sm font-medium">
                                  {newRound ? (
                                    <div className=" flex items-center gap-1">
                                      <span className="text-muted-foreground text-sm">
                                        {
                                          project.latestTrack.steps.filter(
                                            (s) => s.status === "completed"
                                          ).length
                                        }
                                        /{project.latestTrack.steps.length}{" "}
                                        steps
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Circle className="size-2 text-green-500" />
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      {
                                        project.latestTrack.steps.filter(
                                          (s) => s.status === "completed"
                                        ).length
                                      }
                                      /{project.latestTrack.steps.length} steps
                                    </span>
                                  )}
                                </span>
                                <span className="text-sm font-medium">
                                  {trackProgress}%
                                </span>
                              </div>
                            </div>
                            <Progress value={trackProgress} />
                          </div>
                        )}

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
                              href={`/dashboard/projects/${project.id}`}
                              className="flex items-center"
                            >
                              <RevButtons variant={"outline"} size={"sm"}>
                                <FolderOpenDot className="mr-2 h-4 w-4" />
                                <span>View Project</span>
                              </RevButtons>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
function formatStatus(status: string | undefined): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusIcon(status: string | undefined) {
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

function getStatusVariant(status: string | undefined): BadgeVariant {
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
