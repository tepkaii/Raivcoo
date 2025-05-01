// app/set-password/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import SetPasswordForm from "./set-password-form";

export const metadata: Metadata = {
  title: "Set Password - Raivcoo",
  description: "Set or update your account password",
};

export default async function SetPasswordPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (error || !user) {
    redirect("/login?message=You+must+be+logged+in+to+set+a+password");
  }

  // Check if user has password auth
  const hasPasswordAuth = user.identities?.some(
    (identity) =>
      identity.provider === "email" &&
      identity.identity_data?.email === user.email
  );

  // Get user's email
  const userEmail = user.email || "";

  return (
    <SetPasswordForm
      initialHasPassword={!!hasPasswordAuth}
      userEmail={userEmail}
      userId={user.id}
    />
  );
}
