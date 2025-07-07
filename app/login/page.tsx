// app/login/page.tsx
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Raivcoo",
  description:
    "Login to your Raivcoo account to manage your video editing workspace and client projects.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string;
    email?: string;
    message?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return <LoginForm searchParams={params} />;
}