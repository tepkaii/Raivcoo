// app/dashboard/components/dashboard-client-view.tsx
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
  CheckCircle2,
  ChevronRight,
  FolderOpenDot,
  Eye,
  MessageSquare,
  Calendar,
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
  editor?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  project_tracks?: ProjectTrack[];
  latestTrack?: ProjectTrack | null;
  latestTrackUpdate?: string;
}

interface Stats {
  monthly: {
    activeProjects: number;
    pendingReviews: number;
    completedProjects: number;
  };
  allTime: {
    activeProjects: number;
    pendingReviews: number;
    completedProjects: number;
  };
}

export function DashboardClientView({
  activeProjects,
  pendingReviews,
  completedProjects,
}: {
  activeProjects: Project[];
  pendingReviews: Project[];
  completedProjects: Project[];
}) {
  const [showAllTimeStats, setShowAllTimeStats] = useState(false);

  // Calculate monthly stats
  const currentDate = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const monthlyActiveProjects = activeProjects.filter(
    (p) => new Date(p.created_at) >= monthStart
  ).length;

  const monthlyPendingReviews = pendingReviews.filter(
    (p) => new Date(p.created_at) >= monthStart
  ).length;

  const monthlyCompletedProjects = completedProjects.filter(
    (p) => new Date(p.created_at) >= monthStart
  ).length;

  const stats: Stats = {
    monthly: {
      activeProjects: monthlyActiveProjects,
      pendingReviews: monthlyPendingReviews,
      completedProjects: monthlyCompletedProjects,
    },
    allTime: {
      activeProjects: activeProjects.length,
      pendingReviews: pendingReviews.length,
      completedProjects: completedProjects.length,
    },
  };

  const currentStats = showAllTimeStats ? stats.allTime : stats.monthly;

  const renderProjectCard = (project: Project) => {
    const trackProgress = project.latestTrack
      ? calculateTrackProgress(project.latestTrack)
      : 0;

    const requiresReview =
      project.latestTrack?.client_decision === "pending" &&
      project.latestTrack?.steps?.some(
        (s) => s.status === "completed" && s.is_final
      );

    return (
      <div
        key={project.id}
        className="space-y-4 p-4 border-2 border-dashed rounded-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{project.title}</h3>
            <span className="text-muted-foreground">|</span>
            <Badge variant={getStatusVariant(project.status)}>
              {formatStatus(project.status)}
            </Badge>
            {requiresReview && (
              <Badge variant="warning" className="ml-2">
                Needs review
              </Badge>
            )}
          </div>
          <Link href={`/dashboard/reviews/${project.id}`}>
            <RevButtons
              variant="outline"
              size="icon"
              className="text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </RevButtons>
          </Link>
        </div>

        {/* Project Progress */}
        {project.latestTrack && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">
                  Round {project.latestTrack.round_number}{" "}
                </span>
              </div>
              <span className="text-sm font-medium">{trackProgress}%</span>
            </div>
            <Progress value={trackProgress} />
          </div>
        )}

        {/* Editor Info */}
        {project.editor && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.editor.avatar_url} />
              <AvatarFallback>
                {project.editor.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Editor: {project.editor.display_name}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {requiresReview && (
            <Link href={`/review/${project.latestTrack?.id}`}>
              <RevButtons variant="default" size="sm" className="gap-1">
                <Eye className="h-4 w-4" />
                Review
              </RevButtons>
            </Link>
          )}

          {project.status === "active" && (
            <Link href={`/live-track/${project.id}`}>
              <RevButtons variant="outline" size="sm" className="gap-1">
                <Clock className="h-4 w-4" />
                Live Track
              </RevButtons>
            </Link>
          )}
          <Link href={`/dashboard/reviews/${project.id}`}>
            <RevButtons variant="outline" size="sm" className="gap-1">
              <FolderOpenDot className="h-4 w-4" />
              Details
            </RevButtons>
          </Link>
        </div>
      </div>
    );
  };

  // Calculate progress for a track
  const calculateTrackProgress = (track: ProjectTrack | undefined | null) => {
    if (!track || !track.steps?.length) return 0;

    const completedSteps = track.steps.filter(
      (step) => step.status === "completed"
    ).length;
    return Math.round((completedSteps / track.steps.length) * 100);
  };

  // Calculate completion rate
  const calculateCompletionRate = (stats: {
    completedProjects: number;
    activeProjects: number;
    pendingReviews: number;
  }) => {
    const total =
      stats.completedProjects + stats.activeProjects + stats.pendingReviews;
    if (total === 0) return 0;
    return Math.round((stats.completedProjects / total) * 100);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Client Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and approve your projects
          </p>
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Active Projects`}
          value={currentStats.activeProjects}
          icon={<FolderOpenDot className="h-4 w-4" />}
          variant="active"
        />
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Pending Reviews`}
          value={currentStats.pendingReviews}
          icon={<Clock className="h-4 w-4" />}
          variant="pending"
        />
        <StatCard
          title={`${showAllTimeStats ? "All-time" : "Monthly"} Completed`}
          value={currentStats.completedProjects}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="completed"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6">
        {/* Needs Review Section */}
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Needs Your Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingReviews.length > 0 ? (
              pendingReviews.map(renderProjectCard)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No pending reviews</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects Section */}
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpenDot className="h-5 w-5 text-green-500" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeProjects.length > 0 ? (
              activeProjects.map(renderProjectCard)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <FolderOpenDot className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No active projects</p>
              </div>
            )}
          </CardContent>
          {activeProjects.length > 2 && (
            <CardFooter className="border-t pt-4">
              <Link href="/dashboard/projects" className="w-full">
                <RevButtons variant="outline" className="w-full">
                  View All Projects
                </RevButtons>
              </Link>
            </CardFooter>
          )}
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
                Average review time:{" "}
                {stats.monthly.completedProjects > 0 ? "24 hours" : "N/A"}
              </p>
              <p>Active projects this month: {stats.monthly.activeProjects}</p>
            </div>
          </CardContent>
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

// Helper functions
function formatStatus(status: string): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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