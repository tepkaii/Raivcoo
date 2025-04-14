// app/profile/page.tsx

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { updateAccount } from "../dashboard/account/actions";
import { Metadata } from "next";
import StepByStepProfileForm from "./steps";

export const metadata: Metadata = {
  title: "Account - Raivcoo",
  description: "Manage your Raivcoo Account, update personal information.",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <StepByStepProfileForm profile={profile} updateProfile={updateAccount} />
  );
}
