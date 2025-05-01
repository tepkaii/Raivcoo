// app/dashboard/extensions/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ExtensionsClient from "./extensions-client";

export const metadata: Metadata = {
  title: "Extensions - Raivcoo",
  description: "Download and use Raivcoo extensions for Adobe products",
};

export default async function ExtensionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has password auth
  const hasPasswordAuth = user.identities?.some(
    (identity) =>
      identity.provider === "email" &&
      identity.identity_data?.email === user.email
  );

  // Get user profile data
  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <ExtensionsClient
      hasPasswordAuth={!!hasPasswordAuth}
      email={user.email || ""}
      profile={profile}
    />
  );
}
