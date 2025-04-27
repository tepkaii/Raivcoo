// app/dashboard/components/dashboard-client.tsx
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
  Circle,
  Truck,
  FolderOpenDot,
  History,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

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
  latestTrackUpdate?: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
  projects?: { id: string }[];
  created_at?: string;
}

interface Stats {
  monthly: {
    activeProjects: number;
    pendingProjects: number;
    completedProjects: number;
    newClients: number;
  };
  allTime: {
    activeProjects: number;
    pendingProjects: number;
    completedProjects: number;
    totalClients: number;
  };
}

export function DashboardClient({
  recentProjects,
  recentClients,
  stats,
}: {
  recentProjects: Project[];
  recentClients: Client[];
  stats: Stats;
}) {
  const [showAllTimeStats, setShowAllTimeStats] = useState(false);

  // Calculate progress for a track
  const calculateTrackProgress = (track: ProjectTrack | undefined | null) => {
    if (!track || !track.steps?.length) return 0;

    const completedSteps = track.steps.filter(
      (step) => step.status === "completed"
    ).length;
    return Math.round((completedSteps / track.steps.length) * 100);
  };

  // Get the most recent project (for the main card)
  const mostRecentProject =
    recentProjects.length > 0 ? recentProjects[0] : null;
  const trackProgress = mostRecentProject?.latestTrack
    ? calculateTrackProgress(mostRecentProject.latestTrack)
    : 0;

  const hasNewRound =
    mostRecentProject?.latestTrack &&
    mostRecentProject.latestTrack.steps?.length > 0 &&
    mostRecentProject.latestTrack.steps.every(
      (step) => step.status === "pending"
    );

  const currentStats = showAllTimeStats ? stats.allTime : stats.monthly;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header and quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Your video editing workspace</p>
        </div>
        <Button
          onClick={() => setShowAllTimeStats(!showAllTimeStats)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          {showAllTimeStats ? (
            <>
              <Calendar className="h-4 w-4" />
              Show Monthly Stats
            </>
          ) : (
            <>
              <History className="h-4 w-4" />
              Show All-time Stats
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Active Projects`}
          value={currentStats.activeProjects}
          icon={<CircleDot className="h-4 w-4" />}
          variant="active"
        />
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Pending Review`}
          value={currentStats.pendingProjects}
          icon={<Clock className="h-4 w-4" />}
          variant="pending"
        />
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Completed`}
          value={currentStats.completedProjects}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="completed"
        />
        {/* <StatCard
          title={showAllTimeStats ? "Total Clients" : "New Clients (Month)"}
          value={
            showAllTimeStats
              ? currentStats.totalClients
              : currentStats.newClients
          }
          icon={<Users className="h-4 w-4" />}
          variant="default"
        /> */}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6">
        {/* Recent Projects Section */}
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mostRecentProject ? (
              <>
                {/* Main Project Card */}
                <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {mostRecentProject.title}
                      </h3>
                      <span className="text-muted-foreground">|</span>
                      <Badge
                        variant={getStatusVariant(mostRecentProject.status)}
                      >
                        {formatStatus(mostRecentProject.status)}
                      </Badge>
                    </div>
                    <Link href={`/dashboard/projects/${mostRecentProject.id}`}>
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
                  {mostRecentProject.latestTrack && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            Round {mostRecentProject.latestTrack.round_number}{" "}
                            <span className="text-muted-foreground">|</span>
                          </span>
                          {hasNewRound ? (
                            <Circle className="size-2 text-green-500" />
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {mostRecentProject.latestTrack.steps?.filter(
                                (s) => s.status === "completed"
                              ).length || 0}
                              /
                              {mostRecentProject.latestTrack.steps?.length || 0}{" "}
                              steps
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {trackProgress}%
                        </span>
                      </div>
                      <Progress value={trackProgress} />
                    </div>
                  )}

                  {/* Project Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Created |</p>
                      </div>
                      <p>{formatFullDate(mostRecentProject.created_at)}</p>
                    </div>
                    {mostRecentProject.deadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p
                            className={
                              isDeadlineApproaching(mostRecentProject.deadline)
                                ? "text-orange-500"
                                : ""
                            }
                          >
                            {formatFullDate(mostRecentProject.deadline)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/dashboard/projects/${mostRecentProject.id}`}>
                      <RevButtons variant="outline" size="sm" className="gap-1">
                        <FolderOpenDot className="h-4 w-4" />
                        View Project
                      </RevButtons>
                    </Link>
                    <Link href={`/live-track/${mostRecentProject.id}`}>
                      <RevButtons variant="outline" size="sm" className="gap-1">
                        <Truck className="h-4 w-4" />
                        Live Track
                      </RevButtons>
                    </Link>
                  </div>
                </div>

                {/* Additional Projects List */}
                {recentProjects.length > 1 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-muted-foreground">
                      Other Recent Projects
                    </h4>
                    {recentProjects.slice(1).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between px-1 py-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{project.title}</h4>
                            </div>

                            <div className="flex items-center mt-2 gap-2 text-sm">
                              {project.latestTrack && (
                                <span className="text-muted-foreground">
                                  Round {project.latestTrack.round_number}
                                </span>
                              )}
                              <span className="text-muted-foreground">|</span>
                              <Badge variant={getStatusVariant(project.status)}>
                                {formatStatus(project.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
          <CardFooter className="border-t pt-4">
            <Link href="/dashboard/projects" className="w-full">
              <RevButtons variant="outline" className="w-full">
                View All Projects
              </RevButtons>
            </Link>
          </CardFooter>
        </Card>

        {/* Recent Clients Section */}
        <Card className="border-[2px]">
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

        {/* Analytics Section */}
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Project completion rate:{" "}
                {calculateCompletionRate(stats.monthly)}%
              </p>
              <p>
                Average project duration:{" "}
                {stats.monthly.completedProjects > 0 ? "7 days" : "N/A"}
              </p>
              <p>New clients this month: {stats.monthly.newClients}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// New helper function to calculate completion rate
function calculateCompletionRate(stats: {
  completedProjects: number;
  activeProjects: number;
  pendingProjects: number;
}) {
  const total =
    stats.completedProjects + stats.activeProjects + stats.pendingProjects;
  if (total === 0) return 0;
  return Math.round((stats.completedProjects / total) * 100);
}

// StatCard component (unchanged)
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
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div
            className={`rounded-[5px] flex items-center border-2 justify-center size-8 ${iconClasses[variant]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions (unchanged)
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
