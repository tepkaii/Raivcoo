import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import CompleteProfileForm from "./complete-profile-form";
import { completeProfile } from "./actions";
export const metadata: Metadata = {
  title: "Complete Your Profile - Raivcoo",
  description: "Set up your Raivcoo profile to get started.",
};

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>; // Change this to Promise
}) {
  const supabase = await createClient();

  // Await searchParams
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has a complete profile
  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If user already has a complete profile with both display_name and full_name, redirect
  if (profile?.display_name && profile?.full_name) {
    const redirectUrl = params.returnTo
      ? decodeURIComponent(params.returnTo)
      : "/";
    redirect(redirectUrl);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 items-center justify-center">
        <CompleteProfileForm
          profile={
            profile || {
              email: user.email,
              user_id: user.id,
              display_name: null,
              full_name: null,
              avatar_url: null,
            }
          }
          updateProfile={completeProfile}
          returnTo={params.returnTo} // Use params instead of searchParams
        />
      </div>
    </div>
  );
}
