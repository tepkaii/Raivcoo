// app/clients/new/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { CreateClient as createClientAction } from "../actions";
import { Metadata } from "next";
import { ClientForm } from "../[id]/components/ClientForm";

export const metadata: Metadata = {
  title: "Add New Client - Video Editor Dashboard",
  description: "Create a new client record",
};

export default async function page() {
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
    <div className="min-h-screen  py-6 space-y-6">
      <div>
        <h1 className="text-3xl text-center font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Add New Client
        </h1>
        <p className="text-muted-foreground text-center">
          Please fill out the form below to add a new client.
        </p>
      </div>

      <ClientForm
        createClient={createClientAction}
        potentialClients={potentialClients || []}
      />
    </div>
  );
}
