// app/dashboard/reviews/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Hourglass,
  Eye,
} from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: project ? `${project.title} - Project Review` : "Project Review",
    description: "Review project history and deliverables",
  };
}

export default async function ClientProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please log in to view projects");
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !userProfile) {
    redirect("/profile?message=Complete your profile setup");
  }

  // Verify this is a client account
  if (userProfile.account_type !== "client") {
    redirect("/dashboard");
  }

  // Find all clients where email matches this user's email
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id")
    .eq("email", userProfile.email);

  const clientIds = clientsData?.map((client) => client.id) || [];

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `id, title, description, status, deadline, created_at, 
       editor:editor_profiles (id, display_name, avatar_url)`
    )
    .eq("id", id)
    .in("client_id", clientIds)
    .single();

  if (projectError || !project) {
    return notFound();
  }

  // Get all tracks for this project
  const { data: tracks, error: tracksError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, round_number, status, steps, created_at, updated_at, 
       client_decision, final_deliverable_media_type`
    )
    .eq("project_id", id)
    .order("round_number", { ascending: false });

  if (tracksError) {
    console.error(`Error fetching tracks for project ${id}:`, tracksError);
  }

  return (
    <div className="min-h-screen py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/reviews"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              {project.title}
            </h1>{" "}
            |{" "}
            <span
              className={`text-sm ${
                project.status === "completed"
                  ? "text-green-500"
                  : project.status === "active"
                    ? "text-yellow-500"
                    : "text-gray-500"
              }`}
            >
              {project.status === "completed"
                ? "Completed"
                : project.status === "active"
                  ? "Active"
                  : project.status}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            {project.deadline && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                Due {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {project.description && (
        <Card className="space-y-3 p-2">
          <CardTitle className="">Description</CardTitle>
          <CardContent className="pt-6 p-0 text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 mt-8">
        <h2 className="text-xl font-semibold">Review History</h2>
        <div className="space-y-4">
          {tracks && tracks.length > 0 ? (
            tracks.map((track) => {
              let decisionVariant: "success" | "destructive" | "outline" =
                "outline";
              let DecisionIcon = Hourglass;
              let decisionText = "Pending Review";

              if (track.client_decision === "approved") {
                decisionVariant = "success";
                DecisionIcon = ShieldCheck;
                decisionText = "Approved";
              } else if (track.client_decision === "revisions_requested") {
                decisionVariant = "destructive";
                DecisionIcon = ShieldX;
                decisionText = "Revisions Requested";
              }

              // Check if this track has a final deliverable
              const hasFinalDeliverable = track.steps?.some(
                (step: any) => step.is_final && step.status === "completed"
              );

              return (
                <Card key={track.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <CardTitle className="text-lg">
                        Round {track.round_number}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <RevButtons
                          size="sm"
                          variant={decisionVariant}
                          className="flex items-center gap-1 text-xs px-2 py-0.5"
                        >
                          <DecisionIcon className="h-3.5 w-3.5" />
                          {decisionText}
                        </RevButtons>

                        {hasFinalDeliverable && (
                          <Link href={`/review/${track.id}`}>
                            <RevButtons
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">View</span>
                            </RevButtons>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Updated{" "}
                      {new Date(
                        track.updated_at || track.created_at
                      ).toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Media Type:</span>
                      <span className="capitalize">
                        {track.final_deliverable_media_type || "None"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No workflow tracks found for this project.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
