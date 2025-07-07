// app/signup/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import SignUpForm from "./signup";

export const metadata: Metadata = {
  title: "Sign Up - Raivcoo",
  description:
    "Create a free Raivcoo account to start building your video editing portfolio today. Share your projects and connect with potential clients.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/");
  }

  return <SignUpForm searchParams={params} />;
}
