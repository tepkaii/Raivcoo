// app/clients/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Mail, Phone, Clipboard, Film } from "lucide-react";
import { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: client ? `${client.name} - Client Details` : "Client Details",
    description: "View and manage client information and projects",
  };
}
export default async function ClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const { id } = await props.params;
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
    redirect("/profile");
  }

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      company,
      email,
      phone,
      notes
    `
    )
    .eq("id", id)
    .eq("editor_id", editorProfile.id)
    .single();

  if (clientError || !client) {
    return notFound();
  }

  // Fetch projects for this client
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      status,
      deadline,
      created_at
    `
    )
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
  }

  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {client.company && (
            <p className="text-muted-foreground">{client.company}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${client.id}/edit`} passHref>
            <RevButtons variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </RevButtons>
          </Link>
          <Link href={`/projects/new?client=${client.id}`} passHref>
            <RevButtons variant="success">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </RevButtons>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client details */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {client.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Clipboard className="h-4 w-4" /> Notes
                </h3>
                <p className="text-sm whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects list */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="h-5 w-5" /> Projects
          </h2>

          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  passHref
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description || "No description"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {project.status === "completed"
                              ? "Completed"
                              : "Active"}
                          </div>
                          {project.deadline && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Due:{" "}
                              {new Date(project.deadline).toLocaleDateString()}
                            </span>
                          )}
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
                <Film className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No projects yet</h2>
                <p className="text-muted-foreground mb-4">
                  Create a new project for this client
                </p>
                <Link href={`/projects/new?client=${client.id}`} passHref>
                  <RevButtons variant="success">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Project
                  </RevButtons>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
