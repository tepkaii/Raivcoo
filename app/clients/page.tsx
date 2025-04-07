// app/clients/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients - Video Editor Dashboard",
  description: "Manage your clients",
};

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile ID
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    // If no profile exists, redirect to profile creation
    redirect("/profile");
  }

  // Fetch clients
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      company,
      email,
      projects:projects(id)
    `
    )
    .eq("editor_id", editorProfile.id)
    .order("name", { ascending: true });

  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
  }

  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Clients</h1>
        <Link href="/clients/new" passHref>
          <RevButtons variant="success">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Client
          </RevButtons>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} passHref>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle>{client.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {client.company}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {client.email}
                  </p>
                  <div className="mt-2 flex items-center">
                    <div className="bg-muted px-2 py-1 rounded-md text-xs font-medium">
                      {client.projects ? client.projects.length : 0} projects
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No clients yet</h2>
            <p className="text-muted-foreground mb-4">
              Add your first client to get started
            </p>
            <Link href="/clients/new" passHref>
              <RevButtons variant="success">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Client
              </RevButtons>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
