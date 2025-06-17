// app/review/[token]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ReviewContent } from "./ReviewContent";
import { Metadata } from "next";

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();

  const { data: reviewLink } = await supabase
    .from("review_links")
    .select(
      `
      title,
      project:projects(name)
    `
    )
    .eq("link_token", token)
    .eq("is_active", true)
    .single();

  const title =
    reviewLink?.title || reviewLink?.project?.name || "Media Review";

  return {
    title: `${title} - Review`,
    description: "Review shared media content",
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Get review link with associated media and project data
  const { data: reviewData, error } = await supabase
    .from("review_links")
    .select(
      `
      id,
      title,
      created_at,
      expires_at,
      project:projects(
        id,
        name,
        description
      ),
      media:project_media(
        id,
        filename,
        original_filename,
        file_type,
        mime_type,
        file_size,
        r2_url,
        uploaded_at
      )
    `
    )
    .eq("link_token", token)
    .eq("is_active", true)
    .single();

  if (error || !reviewData) {
    return notFound();
  }

  // Check if link has expired
  if (reviewData.expires_at && new Date(reviewData.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Link Expired</h1>
          <p className="text-muted-foreground">
            This review link has expired and is no longer accessible.
          </p>
        </div>
      </div>
    );
  }

  return <ReviewContent reviewData={reviewData} />;
}
