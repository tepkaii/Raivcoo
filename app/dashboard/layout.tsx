import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditorProfile } from "../types/editorProfile";

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

  const portfolio = existingPortfolio as EditorProfile;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar portfolio={portfolio} />
        <main className=" w-full">
          {" "}
          <header className="bg-background border-b px-3  h-[50px]   flex justify-between items-center sticky top-0 z-1">
            {" "}
            <span className="border-2 flex items-center justify-center rounded-md">
              <SidebarTrigger />{" "}
            </span>
          </header>
          <div className="px-4 bg-background">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
