// app/dashboard/pending/components/client-pending-list.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  ChevronRight,
  FolderOpenDot,
  Calendar,
  RotateCcw,
} from "lucide-react";

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
  project_tracks?: any[];
  latestTrack?: any;
  awaitingEditorSubmission: boolean;
}
export const formatFullDate = (
  dateString: string | undefined | null
): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  // For consistent formatting across locales including Arabic
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    // Fallback to basic formatting if Intl fails
    return `${date.toDateString()} ${date.toTimeString().substring(0, 5)}`;
  }
};
export function ClientPendingList({
  pendingProjects,
}: {
  pendingProjects: Project[];
}) {
  const renderProjectCard = (project: Project) => {
    const lastUpdated = project.latestTrack
      ? new Date(
          project.latestTrack.updated_at || project.latestTrack.created_at
        )
      : new Date(project.updated_at);

    const isRevisionRequested =
      project.latestTrack?.client_decision === "revisions_requested";

    return (
      <div
        key={project.id}
        className="space-y-4 p-4 border-2 border-dashed rounded-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{project.title}</h3>
            <span className="text-muted-foreground">|</span>
            <Badge variant="warning">Pending</Badge>
            {isRevisionRequested && (
              <Badge variant="destructive" className="ml-2">
                Revision Requested
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

        {/* Project metadata */}
        <div className="flex justify-between  gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">Last updated:</p>
            <p> {formatFullDate(lastUpdated)}</p>
          </div>

          {project.latestTrack && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">Round:</p>
              <p>{project.latestTrack.round_number}</p>
            </div>
          )}
        </div>

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
          <Link href={`/dashboard/reviews/${project.id}`}>
            <RevButtons variant="outline" size="sm" className="gap-1">
              <FolderOpenDot className="h-4 w-4" />
              Project Details
            </RevButtons>
          </Link>
          {project.status === "active" && (
            <Link href={`/live-track/${project.id}`}>
              <RevButtons variant="outline" size="sm" className="gap-1">
                <Clock className="h-4 w-4" />
                Live Track
              </RevButtons>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Pending Submissions
          </h1>
          <p className="text-muted-foreground">
            Projects waiting for editor submissions
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4">
        <StatCard
          title="Waiting for Editor"
          value={pendingProjects.length}
          icon={<Clock className="h-4 w-4" />}
          variant="pending"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6">
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Awaiting Editor Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingProjects.length > 0 ? (
              pendingProjects.map(renderProjectCard)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <FolderOpenDot className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No pending submissions</p>
                <Link href="/dashboard/reviews">
                  <RevButtons variant="outline" size="sm">
                    View My Reviews
                  </RevButtons>
                </Link>
              </div>
            )}
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
