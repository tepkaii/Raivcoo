// app/dashboard/layout.tsx
// @ts-nocheck
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditorProfile } from "../types/editorProfile";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Film, Users, MessageSquare } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const { data: versionData } = await supabase
    .from("version_log")
    .select("version")
    .eq("platform", "web")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch the existing portfolio data
  const { data: existingPortfolio, error: fetchError } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching portfolio:", fetchError);
    throw fetchError;
  }
  // Redirect to complete-profile if user is logged in but has no display name
  if (
    existingPortfolio &&
    (!existingPortfolio?.display_name ||
      existingPortfolio.display_name.trim() === "")
  ) {
    redirect("/complete-profile");
  }
  // Check if user has password auth
  const hasPasswordAuth = user.identities?.some(
    (identity) =>
      identity.provider === "email" &&
      identity.identity_data?.email === user.email
  );
  const portfolio = existingPortfolio as EditorProfile;
  const isClient = portfolio.account_type === "client";
  const webVersion = versionData?.version || "1.0.0"; // fallback
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          portfolio={portfolio}
          hasPasswordAuth={hasPasswordAuth}
          webVersion={webVersion}
        />
        <main className="w-full">
          <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
            <span className="border-2 flex items-center justify-center rounded-md">
              <SidebarTrigger />
            </span>
            <div className="flex gap-2">
              {!isClient ? (
                // Editor buttons
                <>
                  <Link href="/dashboard/projects/new">
                    <RevButtons size={"sm"} variant={"success"}>
                      <Film className="mr-2 h-4 w-4" />
                      New Project
                    </RevButtons>
                  </Link>
                  <Link href="/dashboard/clients/new">
                    <RevButtons size={"sm"} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Add Client
                    </RevButtons>
                  </Link>
                </>
              ) : (
                // Client buttons
                <Link href="/support">
                  <RevButtons size={"sm"} variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Support
                  </RevButtons>
                </Link>
              )}
            </div>
          </header>
          <div className="px-4 bg-background">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
