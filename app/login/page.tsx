import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Raivcoo",
  description:
    "Login to your Raivcoo account to manage your video editing portfolio, view projects, and explore the community.",
};

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("editor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const isProfileIncomplete =
      profile &&
      (!profile.languages?.length ||
        !profile.skills?.length ||
        !profile.preferred_genres?.length ||
        !profile.software_proficiency?.length ||
        !profile.biography ||
        profile.biography.trim() === "");

    // Now correctly redirect based on condition
    if (isProfileIncomplete) {
      redirect("/token-copy-page");
    } else {
      redirect("/"); // Changed from "/complete-profile" to "/"
    }
  }

  return <LoginForm />;
}
