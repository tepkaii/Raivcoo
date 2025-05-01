// app/complete-profile/page.tsx - corrected version

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { completeInitialProfile } from "./actions";
import { Metadata } from "next";
import StepByStepProfileForm from "./steps";
import Link from "next/link";
import Image from "next/image";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Your Profile - Raivcoo",
  description: "Set up your Raivcoo profile to get started.",
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();

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

  // If user already has a complete profile with display_name and account_type, redirect to dashboard
  if (profile?.display_name && profile?.account_type) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container max-w-screen-xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/Raivcco.svg"
              alt="Raivcoo Logo"
              width={36}
              height={36}
              className="rounded-[5px]"
              priority
              quality={100}
            />
          </Link>
          <Link
            href="/support"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Support
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <StepByStepProfileForm
          profile={
            profile || {
              email: user.email,
              user_id: user.id,
              display_name: null,
              account_type: "editor", // Set default to "editor" instead of null
            }
          }
          updateProfile={completeInitialProfile}
        />
      </div>
    </div>
  );
}
