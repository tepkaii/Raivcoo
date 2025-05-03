// app/review/[trackId]/history/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import HistoryPage from "./HistoryPage";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const supabase = await createClient();
  const { trackId } = await params;
  if (!trackId || trackId === "undefined") {
    return {
      title: "Project History",
      robots: { index: false, follow: false },
    };
  }
  try {
    const { data: trackData } = await supabase
      .from("project_tracks")
      .select(`project:projects!inner(title)`)
      .eq("id", trackId)
      .maybeSingle();
    return {
      title: trackData?.project
        ? `History: ${trackData.project.title}`
        : "Project History",
      description: "Review project history.",
      robots: { index: false, follow: false },
    };
  } catch (error) {
    return {
      title: "Project History",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const supabase = await createClient();

  if (!trackId || trackId === "undefined") {
    return notFound();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect(
      `/login?message=Please log in to view project history.&redirectTo=${encodeURIComponent(
        `/review/${trackId}/history`
      )}`
    );
  }
  if (!user.email) {
    return (
      <div className="container mx-auto py-6 mt-24 text-center text-red-600">
        Error: User email missing. Cannot verify authorization.
      </div>
    );
  }

  // Fetch the current project track info
  const { data: currentTrack, error: currentTrackError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, round_number, steps, client_decision, created_at, updated_at,
       project:projects!inner(id, title, editor_id, client:clients!inner(id, name, email, company, phone))`
    )
    .eq("id", trackId)
    .maybeSingle();

  if (
    currentTrackError ||
    !currentTrack ||
    !currentTrack.project ||
    !currentTrack.project.client
  ) {
    console.error("Error fetching track data:", currentTrackError);
    return notFound();
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  const isEditor =
    editorProfile && editorProfile.id === currentTrack.project.editor_id;
  const isClient = currentTrack.project.client.email === user.email;

  if (!isEditor && !isClient) {
    console.warn(
      `AUTH FAILED: User ${user.email} tried accessing track history ${trackId} without matching editor or client`
    );
    return (
      <div className="container mx-auto mt-24 py-12 text-center max-w-xl">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-muted-foreground text-base">
          You are not authorized to view this project history. Make sure you're
          logged in with the correct account associated with the project.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <RevButtons variant="outline">Back to Dashboard</RevButtons>
        </Link>
      </div>
    );
  }

  // Fetch all rounds for this project
  const { data: allTracks, error: allTracksError } = await supabase
    .from("project_tracks")
    .select(
      `
      id, 
      project_id, 
      round_number, 
      client_decision, 
      created_at,
      updated_at
    `
    )
    .eq("project_id", currentTrack.project_id)
    .order("round_number", { ascending: false });

  if (allTracksError) {
    console.error("Error fetching track history:", allTracksError);
    return (
      <div className="container mx-auto py-6 text-center mt-10">
        <h1 className="text-2xl font-bold mb-4">Error Loading History</h1>
        <p className="text-muted-foreground">
          Unable to load project history. Please try again later.
        </p>
        <Link href={`/review/${trackId}`} className="mt-4 inline-block">
          <RevButtons variant="outline">Back to Review</RevButtons>
        </Link>
      </div>
    );
  }

  // Fetch comments for ALL tracks in the project
  const trackIds = allTracks?.map((track) => track.id) || [];
  const { data: allCommentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select(`id, comment, created_at, track_id`)
    .in("track_id", trackIds)
    .order("comment->timestamp", { ascending: true });

  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
  }

  // Get client display name
  const clientDisplayName =
    currentTrack.project.client.name || user.email || "Client";

  // Organize comments by track ID
  const commentsByTrack = (allCommentsData || []).reduce(
    (acc, comment) => {
      if (!acc[comment.track_id]) {
        acc[comment.track_id] = [];
      }
      acc[comment.track_id].push({
        id: comment.id,
        created_at: comment.created_at,
        comment: comment.comment as {
          text: string;
          timestamp: number;
          images?: string[];
          links?: { url: string; text: string }[];
        },
        commenter_display_name: clientDisplayName,
        isOwnComment: isClient, // Only mark as own comment if user is the client
      });
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Extract client info for improved UI
  const clientInfo = {
    name: currentTrack.project.client.name || clientDisplayName,
    company: currentTrack.project.client.company,
    email: currentTrack.project.client.email,
    phone: currentTrack.project.client.phone,
  };

  return (
    <HistoryPage
      currentTrack={currentTrack}
      allTracks={allTracks || []}
      commentsByTrack={commentsByTrack}
      clientName={clientInfo.name}
      projectTitle={currentTrack.project.title}
    />
  );
}
