import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientDetailPage from "./ClientDetailPage";

export default async function page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id: clientId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?message=Please log in.");
  }

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    return redirect("/profile?error=Editor profile needed");
  }

  // --- Data Fetching ---
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select(`id, name, company, email, phone, notes`)
    .eq("id", clientId)
    .eq("editor_id", editorProfile.id)
    .single();

  if (clientError || !clientData) {
    return redirect("/dashboard/clients?error=Client not found");
  }

  const { data: projectsData } = await supabase
    .from("projects")
    .select(
      `id, title, description, status, deadline, created_at, project_tracks ( round_number )`
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return <ClientDetailPage client={clientData} projects={projectsData || []} />;
}
