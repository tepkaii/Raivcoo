// app/clients/new/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientForm from "../ClientForm";
import { CreateClient as createClientAction } from "../actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New Client - Video Editor Dashboard",
  description: "Create a new client record",
};

export default async function NewClientPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile to verify it exists
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    redirect("/profile");
  }

  // Fetch other editor profiles that could be clients
  const { data: potentialClients } = await supabase
    .from("editor_profiles")
    .select("id, full_name, email")
    .neq("user_id", user.id) // Exclude current user
    .order("full_name", { ascending: true });

  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      <h1 className="text-2xl font-bold">Add New Client</h1>
      <ClientForm
        createClient={createClientAction}
        potentialClients={potentialClients || []}
      />
    </div>
  );
}