// app/api/search/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, filters, currentProjectId } = await request.json();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const results = [];

    // Search projects if type is "all" or "projects"
    if (filters.type === "all" || filters.type === "projects") {
      // First get projects owned by user
      let ownedProjectsQuery = supabase
        .from("projects")
        .select("id, name, description, created_at, updated_at")
        .eq("editor_id", profile.id);

      if (query.trim()) {
        ownedProjectsQuery = ownedProjectsQuery.or(
          `name.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      const { data: ownedProjects, error: ownedError } =
        await ownedProjectsQuery;

      // Then get projects where user is a member
      const { data: membershipProjects, error: memberError } = await supabase
        .from("project_members")
        .select(
          `
          project_id,
          projects!inner(id, name, description, created_at, updated_at)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "accepted");

      // Combine and deduplicate projects
      const allProjects = [];

      if (ownedProjects) {
        allProjects.push(...ownedProjects);
      }

      if (membershipProjects) {
        membershipProjects.forEach((mp) => {
          const project = mp.projects;
          // Only add if not already in owned projects
          if (!allProjects.find((p) => p.id === project.id)) {
            // Apply search filter for member projects too
            if (
              !query.trim() ||
              project.name.toLowerCase().includes(query.toLowerCase()) ||
              (project.description &&
                project.description.toLowerCase().includes(query.toLowerCase()))
            ) {
              allProjects.push(project);
            }
          }
        });
      }

      if (allProjects.length > 0) {
        results.push(
          ...allProjects.map((project) => ({
            id: project.id,
            type: "project" as const,
            title: project.name,
            subtitle: project.description || "No description",
            url: `/dashboard/projects/${project.id}`,
            status: "active",
            created_at: project.created_at,
            updated_at: project.updated_at,
          }))
        );
      }
    }

    // Search media if type is "all" or "media"
    if (filters.type === "all" || filters.type === "media") {
      // Get user's accessible projects first
      const userProjects = [];

      // Owned projects
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("editor_id", profile.id);

      if (ownedProjects) {
        userProjects.push(...ownedProjects.map((p) => p.id));
      }

      // Member projects
      const { data: memberProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (memberProjects) {
        memberProjects.forEach((mp) => {
          if (!userProjects.includes(mp.project_id)) {
            userProjects.push(mp.project_id);
          }
        });
      }

      if (userProjects.length > 0) {
        // Now search media in these projects
        let mediaQuery = supabase
          .from("project_media")
          .select(
            `
            id,
            filename,
            original_filename,
            file_type,
            file_size,
            r2_url,
            uploaded_at,
            status,
            project_id
          `
          )
          .in("project_id", userProjects);

        if (query.trim()) {
          mediaQuery = mediaQuery.or(
            `original_filename.ilike.%${query}%,filename.ilike.%${query}%`
          );
        }

        if (filters.mediaType && filters.mediaType !== "all") {
          mediaQuery = mediaQuery.eq("file_type", filters.mediaType);
        }

        if (filters.status && filters.status !== "all") {
          mediaQuery = mediaQuery.eq("status", filters.status);
        }

        const { data: media, error: mediaError } = await mediaQuery;

        if (media && media.length > 0) {
          // Get project names for the media
          const { data: projects } = await supabase
            .from("projects")
            .select("id, name")
            .in("id", [...new Set(media.map((m) => m.project_id))]);

          const projectMap = new Map(
            projects?.map((p) => [p.id, p.name]) || []
          );

          results.push(
            ...media.map((item) => ({
              id: item.id,
              type: "media" as const,
              title: item.original_filename,
              subtitle: `Project: ${projectMap.get(item.project_id) || "Unknown"}`,
              url: `/dashboard/projects/${item.project_id}`,
              status: item.status,
              mediaType: item.file_type as "video" | "image",
              fileSize: item.file_size,
              projectName: projectMap.get(item.project_id),
              projectId: item.project_id,
              mediaUrl: `/media/full-size/${item.id}`,
              thumbnailUrl: item.r2_url,
              uploadedAt: item.uploaded_at,
              created_at: item.uploaded_at,
              updated_at: item.uploaded_at,
            }))
          );
        }
      }
    }

   

    // Apply sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return filters.sortOrder === "asc"
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        case "file_size":
          const aSize = a.fileSize || 0;
          const bSize = b.fileSize || 0;
          return filters.sortOrder === "asc" ? aSize - bSize : bSize - aSize;
        case "created_at":
        case "updated_at":
        default:
          const aDate =
            a.updated_at || a.created_at || new Date().toISOString();
          const bDate =
            b.updated_at || b.created_at || new Date().toISOString();
          return filters.sortOrder === "asc"
            ? new Date(aDate).getTime() - new Date(bDate).getTime()
            : new Date(bDate).getTime() - new Date(aDate).getTime();
      }
    });


    return NextResponse.json({
      results: results.slice(0, 50),
      debug: {
        userProfileId: profile.id,
        queryTerm: query,
        filters: filters,
        totalResults: results.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
