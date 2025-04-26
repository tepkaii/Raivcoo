// app/dashboard/reviews/components/client-reviews-list.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  Eye,
  FolderOpenDot,
  Loader2,
  Calendar,
  Film,
  Image as ImageIcon,
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
  needsReview: boolean;
}

export function ClientReviewsList({
  pendingReviews,
  reviewedProjects,
}: {
  pendingReviews: Project[];
  reviewedProjects: Project[];
}) {
  const renderProjectCard = (project: Project) => {
    const lastUpdated = project.latestTrack
      ? new Date(
          project.latestTrack.updated_at || project.latestTrack.created_at
        )
      : new Date(project.updated_at);

    const mediaType = project.latestTrack?.final_deliverable_media_type;
    const MediaIcon = mediaType === "image" ? ImageIcon : Film;

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
            {project.needsReview && (
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

        {/* Project metadata */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">Last updated:</p>
            <p>{lastUpdated.toLocaleDateString()}</p>
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
            {mediaType && (
              <>
                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MediaIcon className="h-4 w-4" />
                  <span className="capitalize">{mediaType}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Client Decision Status */}
        {project.latestTrack?.client_decision &&
          project.latestTrack.client_decision !== "pending" && (
            <div
              className={`flex items-center gap-2 text-sm ${
                project.latestTrack.client_decision === "approved"
                  ? "text-green-500"
                  : "text-orange-500"
              }`}
            >
              {project.latestTrack.client_decision === "approved" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                {project.latestTrack.client_decision === "approved"
                  ? "Approved"
                  : "Revision Requested"}
              </span>
            </div>
          )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {project.needsReview && project.latestTrack && (
            <Link href={`/review/${project.latestTrack.id}`}>
              <RevButtons variant="default" size="sm" className="gap-1">
                <Eye className="h-4 w-4" />
                Review Now
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

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            My Reviews
          </h1>
          <p className="text-muted-foreground">
            Review and approve your projects
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Pending Reviews"
          value={pendingReviews.length}
          icon={<Clock className="h-4 w-4" />}
          variant="pending"
        />
        <StatCard
          title="Reviewed Projects"
          value={reviewedProjects.length}
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

        {/* Reviewed Projects Section */}
        <Card className="border-[2px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Previously Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {reviewedProjects.length > 0 ? (
              reviewedProjects.slice(0, 3).map(renderProjectCard)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <FolderOpenDot className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No reviewed projects yet
                </p>
              </div>
            )}
          </CardContent>
          {reviewedProjects.length > 3 && (
            <CardFooter className="border-t pt-4">
              <Link href="/dashboard/reviews/history" className="w-full">
                <RevButtons variant="outline" className="w-full">
                  View All Reviewed Projects
                </RevButtons>
              </Link>
            </CardFooter>
          )}
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
