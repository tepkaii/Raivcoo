// app/clients/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react"; // Removed MoreVertical
import { Metadata } from "next";
import { ClientCard } from "./ClientCard";

// Import the new ClientCard component

export const metadata: Metadata = {
  title: "Clients - Video Editor Dashboard",
  description: "Manage your clients",
};

export default async function page() {
  const supabase = await createClient(); // Runs on the server

  const {
    data: { user },
  } = await supabase.auth.getUser(); // Runs on the server

  if (!user) {
    redirect("/login");
  }

  // Get editor profile ID - Runs on the server
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    console.error("Editor profile error or not found:", profileError);
    // Redirect to profile setup or show an error state
    redirect("/profile?error=Editor profile not found"); // Example redirect with query param
  }

  // Fetch clients - Runs on the server
  // Define the type explicitly for better clarity
  type ClientWithProjects = {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    projects: { id: string }[] | null;
  };

  const { data: clientsData, error: clientsError } = await supabase
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

  // Cast the fetched data to the defined type
  const clients: ClientWithProjects[] | null = clientsData;

  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
  }

  // ClientCard component is now defined in its own file and imported
  return (
    <div className="min-h-screen  py-6 space-y-6 ">
      <div className="flex justify-between items-center">
        <div className="flex justify-between items-center gap-4 flex-wrap  pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              My Clients
            </h1>
            <p className="text-lg text-muted-foreground">
              View and manage your Clients
            </p>
          </div>
        </div>
        <Link href="/dashboard/clients/new" passHref>
          <RevButtons variant="success">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Client
          </RevButtons>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Use the imported ClientCard component */}
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : clientsError ? (
        // Optional: Show an error state if fetching failed
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-red-600">
              Failed to load clients. Please try again later.
            </p>
            <p className="text-sm text-muted-foreground">
              {clientsError.message}
            </p>
          </CardContent>
        </Card>
      ) : (
        // Show the "No clients yet" state
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No clients yet</h2>
            <p className="text-muted-foreground mb-4">
              Add your first client to get started
            </p>
            <Link href="/dashboard/clients/new" passHref>
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
