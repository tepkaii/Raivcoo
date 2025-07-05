// app/invite/accept/[token]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { InvitationAcceptance } from "./InvitationAcceptance";
import { XMarkIcon } from "@heroicons/react/24/solid";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Check authentication FIRST - before any database queries
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is logged in, redirect to login with return URL
  if (!user) {
    const returnUrl = encodeURIComponent(`/invite/accept/${token}`);
    redirect(`/login?returnTo=${returnUrl}`);
  }

  // NOW query the database (user is authenticated so RLS policies will work)
  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .select(
      `
     id,
     project_id,
     email,
     role,
     expires_at,
     used_at,
     invited_by,
     created_at
   `
    )
    .eq("invitation_token", token)
    .single();

  if (error || !invitation) {
    return notFound();
  }

  // Check if invitation has expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  const isExpired = now > expiresAt;

  // Check if invitation has already been used
  const isUsed = !!invitation.used_at;

  if (isExpired || isUsed) {
    return (
      <div className="min-h-screen select-none flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 text-center border">
          <div className="mb-4">
            <div className="w-16 h-16 bg-destructive rounded-[5px] border-2 border-black/20 flex items-center justify-center mx-auto">
              <XMarkIcon className="size-10 text-red-200" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {isExpired ? "Invitation Expired" : "Invitation Already Used"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isExpired
              ? "This invitation has expired. Please request a new invitation from the project owner."
              : "This invitation has already been used."}
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Get the logged-in user's editor profile
  const { data: userProfile } = await supabase
    .from("editor_profiles")
    .select("email")
    .eq("user_id", user.id)
    .single();

  // Check if the logged-in user's email matches the invitation email
  const userEmail = userProfile?.email || user.email;
  const invitationEmail = invitation.email.toLowerCase().trim();
  const currentUserEmail = userEmail?.toLowerCase().trim();

  // If emails don't match, redirect to login (they need to sign in with the correct account)
  if (currentUserEmail !== invitationEmail) {
    const returnUrl = encodeURIComponent(`/invite/accept/${token}`);
    redirect(
      `/login?returnTo=${returnUrl}&email=${encodeURIComponent(invitationEmail)}&message=${encodeURIComponent("Please sign in with the email address that received this invitation")}`
    );
  }

  // Get inviter info
  const { data: inviterProfile } = await supabase
    .from("editor_profiles")
    .select("full_name, display_name, email")
    .eq("id", invitation.invited_by)
    .single();

  const inviterName =
    inviterProfile?.display_name ||
    inviterProfile?.full_name ||
    inviterProfile?.email ||
    "Someone";

  return (
    <InvitationAcceptance
      invitation={invitation}
      inviterName={inviterName}
      currentUser={user}
    />
  );
}
