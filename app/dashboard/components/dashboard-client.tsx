// app/dashboard/dashboard-client.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Film,
  Calendar,
  CheckCircle2,
  CircleDot,
  ChevronRight,
  Layers,
  CheckCircle,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  created_at: string;
  client?: {
    id: string;
    name: string;
  };
  project_tracks?: ProjectTrack[];
  latestTrack?: ProjectTrack | null;
}

interface Client {
  id: string;
  name: string;
  company?: string;
  projects?: { id: string }[];
}

export function DashboardClient({
  lastProject,
  recentClients,
  stats,
}: {
  lastProject: Project | null;
  recentClients: Client[];
  stats: {
    activeProjects: number;
    pendingProjects: number;
    completedProjects: number;
    totalClients: number;
  };
}) {
  // Calculate progress for the latest track
  const calculateTrackProgress = (track: ProjectTrack | undefined | null) => {
    if (!track || !track.steps?.length) return 0;

    const completedSteps = track.steps.filter(
      (step) => step.status === "completed"
    ).length;
    return Math.round((completedSteps / track.steps.length) * 100);
  };

  const trackProgress = lastProject?.latestTrack
    ? calculateTrackProgress(lastProject.latestTrack)
    : 0;

  const hasNewRound =
    lastProject?.latestTrack &&
    lastProject.latestTrack.steps?.length > 0 &&
    lastProject.latestTrack.steps.every((step) => step.status === "pending");

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header and quick actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your video editing workspace</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/projects/new">
            <RevButtons>
              <Film className="mr-2 h-4 w-4" />
              New Project
            </RevButtons>
          </Link>
          <Link href="/dashboard/clients/new">
            <RevButtons variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add Client
            </RevButtons>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<CircleDot className="h-4 w-4" />}
          variant="active"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingProjects}
          icon={<Clock className="h-4 w-4" />}
          variant="pending"
        />
        <StatCard
          title="Completed"
          value={stats.completedProjects}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="completed"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6">
        {/* Last Project Section */}
        <Card className="border-[2px] ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              {lastProject ? "Current Project" : "No Active Projects"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastProject ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl  font-semibold">
                      {lastProject.title}
                    </h3>
                    <span className="text-muted-foreground">|</span>
                    <Badge variant={getStatusVariant(lastProject.status)}>
                      {formatStatus(lastProject.status)}
                    </Badge>
                  </div>
                  <Link href={`/dashboard/projects/${lastProject.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Project Progress */}
                {lastProject.latestTrack && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          Round {lastProject.latestTrack.round_number}{" "}
                          <span className="text-muted-foreground">|</span>
                        </span>
                        {hasNewRound ? (
                          <Circle className="size-2 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {" "}
                            {lastProject.latestTrack.steps?.filter(
                              (s) => s.status === "completed"
                            ).length || 0}
                            /{lastProject.latestTrack.steps?.length || 0} steps
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {trackProgress}%
                      </span>
                    </div>
                    <Progress
                      value={trackProgress}
                      className="h-2"
                      indicatorColor={
                        lastProject.status === "completed"
                          ? "bg-green-500"
                          : lastProject.latestTrack.client_decision ===
                              "approved"
                            ? "bg-blue-500"
                            : lastProject.latestTrack.client_decision ===
                                "revisions_requested"
                              ? "bg-yellow-500"
                              : "bg-primary"
                      }
                    />
                  </div>
                )}

                {/* Project Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 ">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Created |</p>
                    </div>
                    <p>{formatFullDate(lastProject.created_at)}</p>
                  </div>
                  {lastProject.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p
                          className={
                            isDeadlineApproaching(lastProject.deadline)
                              ? "text-orange-500"
                              : ""
                          }
                        >
                          {formatFullDate(lastProject.deadline)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {lastProject.description && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {lastProject.description}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4">
                  <Link href={`/dashboard/projects/${lastProject.id}`}>
                    <RevButtons variant="outline" size="sm" className="gap-1">
                      <Layers className="h-4 w-4" />
                      View Project
                    </RevButtons>
                  </Link>
                  {lastProject.latestTrack && (
                    <Link href={`/review/${lastProject.latestTrack.id}`}>
                      <RevButtons variant="outline" size="sm" className="gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Review
                      </RevButtons>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Film className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No active projects</p>
                <Link href="/dashboard/projects/new">
                  <Button size="sm">Create Project</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients Section */}
        <Card className="border-[2px] ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <Avatar>
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${client.id}.png`}
                      />
                      <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{client.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.company || "No company specified"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="px-2 py-0.5">
                        {client.projects?.length || 0} project(s)
                      </Badge>
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No clients yet</p>
                <Link href="/dashboard/clients/new">
                  <Button size="sm">Add Client</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Link href="/dashboard/clients" className="w-full">
              <RevButtons variant="outline" className="w-full">
                View All Clients
              </RevButtons>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// StatCard component
function StatCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "active" | "pending" | "completed" | "default";
}) {
  const variantClasses = {
    active: "bg-[#1E3A8A]/40 text-[#3B82F6]",
    pending: "bg-[#783F04]/40 text-[#F59E0B]",
    completed: "bg-[#064E3B]/40 text-[#10B981]",
    default: "bg-muted text-foreground",
  };

  const iconClasses = {
    active: "bg-[#1E3A8A]/40 text-[#3B82F6]",
    pending: "bg-[#783F04]/40 text-[#F59E0B]",
    completed: "bg-[#064E3B]/40 text-[#10B981]",
    default: "bg-gray-700 text-gray-300",
  };

  return (
    <Card className="hover:shadow-sm transition-shadow border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <div
            className={`rounded-[5px] flex items-center border-2 justify-center size-8 ${iconClasses[variant]}`}
          >
            <h3 className="font-bold ">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function formatStatus(status: string): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatFullDate(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(
  status: string | undefined | null
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info" {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "active":
      return "info";
    case "in_progress":
      return "warning";
    case "on_hold":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function isDeadlineApproaching(deadline: string | undefined | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 3;
}
