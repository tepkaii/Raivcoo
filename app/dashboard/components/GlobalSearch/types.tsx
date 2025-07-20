// app/dashboard/components/GlobalSearch/types.ts
// @ts-nocheck
"use client";

import {
  DocumentTextIcon,
  FolderIcon,
  PhotoIcon,
  PlayIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
  DocumentIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/solid";

// Enhanced search filters for expanded media types and folders
export interface EnhancedSearchFilters {
  status:
    | "all"
    | "active"
    | "pending"
    | "completed"
    | "on_hold"
    | "cancelled"
    | "in_progress"
    | "needs_review"
    | "rejected"
    | "approved";
  sortBy: "updated_at" | "created_at" | "name" | "file_size";
  sortOrder: "asc" | "desc";
  type: "all" | "projects" | "folders" | "media";
  mediaType?: "all" | "video" | "image" | "audio" | "document" | "svg";
}

// Enhanced search result with expanded types including folders
export interface EnhancedSearchResult {
  id: string;
  type: "project" | "folder" | "media";
  title: string;
  subtitle: string;
  url: string;
  status?: string;
  mediaType?: "video" | "image" | "audio" | "document" | "svg";
  mimeType?: string;
  fileSize?: number;
  projectName?: string;
  projectId?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
  r2_url?: string;
  original_filename?: string;
  created_at?: string;
  updated_at?: string;
  // Project-specific fields
  fileCount?: number;
  totalSize?: number;
  // Folder-specific fields
  folderPath?: string;
  parentFolderId?: string;
  description?: string;
  totalFiles?: number;
  videoCount?: number;
  imageCount?: number;
  lastUpload?: string;
  // Folder media files for thumbnails
  folderMediaFiles?: {
    id: string;
    thumbnail_r2_url?: string;
    r2_url?: string;
    file_type: string;
    original_filename: string;
  }[];
}

export interface GlobalSearchProps {
  onMediaSelect?: (media: EnhancedSearchResult) => void;
  onFolderSelect?: (folder: EnhancedSearchResult) => void;
  currentProjectId?: string;
  compact?: boolean;
}

// Media type detection utility
export const getMediaTypeFromMimeType = (
  mimeType: string
): "video" | "image" | "audio" | "document" | "svg" => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType === "text/plain"
  )
    return "document";
  return "document";
};

// Enhanced media type icon component
export const MediaTypeIcon = ({ result }: { result: EnhancedSearchResult }) => {
  if (result.type === "project") {
    return <FolderIcon className="h-5 w-5 text-blue-500" />;
  }

  if (result.type === "folder") {
    return <FolderOpenIcon className="h-5 w-5 text-yellow-500" />;
  }

  const mediaType =
    result.mediaType ||
    (result.mimeType ? getMediaTypeFromMimeType(result.mimeType) : "document");

  switch (mediaType) {
    case "video":
      return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
    case "image":
      return <PhotoIcon className="h-5 w-5 text-green-500" />;
    case "svg":
      return <CodeBracketIcon className="h-5 w-5 text-teal-500" />;
    case "audio":
      return <MusicalNoteIcon className="h-5 w-5 text-purple-500" />;
    case "document":
      return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    default:
      return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
  }
};

// Enhanced media preview component with folder support
export const MediaPreview = ({ result }: { result: EnhancedSearchResult }) => {
  if (result.type === "project") {
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center flex-shrink-0">
        <FolderIcon className="h-6 w-6 text-white" />
      </div>
    );
  }

  if (result.type === "folder") {
    // Show folder thumbnail with media files if available
    if (result.folderMediaFiles && result.folderMediaFiles.length > 0) {
      // Filter out SVG files from thumbnail display
      const displayableMedia = result.folderMediaFiles.filter(
        (media) =>
          media.file_type === "image" &&
          !media.original_filename.toLowerCase().endsWith(".svg") &&
          (media.thumbnail_r2_url || media.r2_url)
      );

      if (displayableMedia.length === 1) {
        const media = displayableMedia[0];
        const thumbnailUrl = media.thumbnail_r2_url || media.r2_url;

        return (
          <div className="w-12 h-12 bg-black rounded-md overflow-hidden flex-shrink-0 relative">
            <img
              src={thumbnailUrl}
              alt={media.original_filename}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                    <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                  </div>
                `;
              }}
            />
            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
              {result.totalFiles || 0}
            </div>
          </div>
        );
      } else if (displayableMedia.length > 1) {
        // Show grid of thumbnails for multiple files (excluding SVGs)
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
            <div className="grid grid-cols-2 gap-0.5 h-full">
              {displayableMedia.slice(0, 4).map((media, index) => {
                const thumbnailUrl = media.thumbnail_r2_url || media.r2_url;

                return (
                  <div key={media.id} className="bg-black">
                    <img
                      src={thumbnailUrl}
                      alt={media.original_filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
              {result.totalFiles || 0}
            </div>
          </div>
        );
      }
    }

    // Default folder icon with file count (fallback case for folders with no displayable images or SVG-only folders)
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-md flex items-center justify-center flex-shrink-0 relative">
        <FolderOpenIcon className="h-6 w-6 text-white" />
        {result.totalFiles !== undefined && (
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
            {result.totalFiles}
          </div>
        )}
      </div>
    );
  }

  // Rest of the component remains the same...
  const mediaType =
    result.mediaType ||
    (result.mimeType ? getMediaTypeFromMimeType(result.mimeType) : "document");

  // If it's an image and we have a thumbnail or r2_url, show the actual image
  if (mediaType === "image" && (result.thumbnailUrl || result.r2_url)) {
    return (
      <div className="w-12 h-12 bg-black rounded-md overflow-hidden flex-shrink-0">
        <img
          src={result.thumbnailUrl || result.r2_url}
          alt={result.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient background on error
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement!.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8zm2 2v4h4v-4h-4z"/>
                </svg>
              </div>
            `;
          }}
        />
      </div>
    );
  }

  // For videos, show thumbnail if available, otherwise gradient
  if (mediaType === "video") {
    if (result.thumbnailUrl) {
      return (
        <div className="w-12 h-12 bg-black rounded-md overflow-hidden flex-shrink-0 relative">
          <img
            src={result.thumbnailUrl}
            alt={result.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.innerHTML = `
               <div class="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                 <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M8 5v14l11-7z"/>
                 </svg>
               </div>
             `;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayIcon className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-md flex items-center justify-center flex-shrink-0">
        <VideoCameraIcon className="h-6 w-6 text-white" />
      </div>
    );
  }

  // Fallback gradients for other media types
  const gradients = {
    audio: "from-purple-500 to-purple-700",
    svg: "from-teal-500 to-teal-700",
    document: "from-gray-500 to-gray-700",
  };

  const icons = {
    audio: MusicalNoteIcon,
    svg: CodeBracketIcon,
    document: DocumentIcon,
  };

  const gradient =
    gradients[mediaType as keyof typeof gradients] ||
    "from-gray-500 to-gray-700";
  const IconComponent = icons[mediaType as keyof typeof icons] || DocumentIcon;

  return (
    <div
      className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0`}
    >
      <IconComponent className="h-6 w-6 text-white" />
    </div>
  );
};

// Status badge variant helper
export const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "approved":
      return "green";
    case "active":
    case "in_progress":
      return "default";
    case "needs_review":
      return "warning";
    case "cancelled":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

// File size formatter
export const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Direct Supabase search function with folder support
export const performDirectSearch = async (
  term: string,
  filters: EnhancedSearchFilters,
  currentProjectId?: string
) => {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profile not found");
  }

  const results: EnhancedSearchResult[] = [];

  // Search projects if type is "all" or "projects"
  if (filters.type === "all" || filters.type === "projects") {
    // Get owned projects with media stats
    let ownedProjectsQuery = supabase
      .from("projects")
      .select(
        `
       id, 
       name, 
       description, 
       created_at, 
       updated_at,
       project_media(id, file_size)
     `
      )
      .eq("editor_id", profile.id);

    if (term.trim()) {
      ownedProjectsQuery = ownedProjectsQuery.or(
        `name.ilike.%${term}%,description.ilike.%${term}%`
      );
    }

    const { data: ownedProjects } = await ownedProjectsQuery;

    // Get member projects with media stats
    const { data: membershipProjects } = await supabase
      .from("project_members")
      .select(
        `
       project_id,
       projects!inner(
         id, 
         name, 
         description, 
         created_at, 
         updated_at,
         project_media(id, file_size)
       )
     `
      )
      .eq("user_id", user.id)
      .eq("status", "accepted");

    // Combine and deduplicate projects
    const allProjects = [];
    if (ownedProjects) allProjects.push(...ownedProjects);

    if (membershipProjects) {
      membershipProjects.forEach((mp) => {
        const project = mp.projects;
        if (!allProjects.find((p) => p.id === project.id)) {
          if (
            !term.trim() ||
            project.name.toLowerCase().includes(term.toLowerCase()) ||
            (project.description &&
              project.description.toLowerCase().includes(term.toLowerCase()))
          ) {
            allProjects.push(project);
          }
        }
      });
    }

    // Add projects to results with file count and total size
    results.push(
      ...allProjects.map((project) => {
        const mediaFiles = project.project_media || [];
        const fileCount = mediaFiles.length;
        const totalSize = mediaFiles.reduce(
          (sum: number, media: any) => sum + (media.file_size || 0),
          0
        );

        return {
          id: project.id,
          type: "project" as const,
          title: project.name,
          subtitle: `${fileCount} file${fileCount !== 1 ? "s" : ""} • ${formatFileSize(totalSize)}`,
          url: `/dashboard/projects/${project.id}`,
          status: "active",
          created_at: project.created_at,
          updated_at: project.updated_at,
          fileCount,
          totalSize,
        };
      })
    );
  }

  // Search folders if type is "all" or "folders"
  if (filters.type === "all" || filters.type === "folders") {
    // Get user's accessible projects
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
      // Search folders in accessible projects
      let foldersQuery = supabase
        .from("project_folders")
        .select(
          `
         id,
         name,
         description,
         created_at,
         updated_at,
         project_id,
         parent_folder_id,
         projects!inner(name)
       `
        )
        .in("project_id", userProjects);

      if (term.trim()) {
        foldersQuery = foldersQuery.or(
          `name.ilike.%${term}%,description.ilike.%${term}%`
        );
      }

      const { data: folders } = await foldersQuery;

      if (folders && folders.length > 0) {
        // Get media files for each folder to calculate stats
        const folderIds = folders.map((f) => f.id);
        const { data: folderMedia } = await supabase
          .from("project_media")
          .select(
            `
           id,
           file_size,
           file_type,
           folder_id,
           uploaded_at,
           thumbnail_r2_url,
           r2_url,
           original_filename
         `
          )
          .in("folder_id", folderIds);

        const folderMediaMap = new Map();
        folderMedia?.forEach((media) => {
          if (!folderMediaMap.has(media.folder_id)) {
            folderMediaMap.set(media.folder_id, []);
          }
          folderMediaMap.get(media.folder_id).push(media);
        });

        results.push(
          ...folders.map((folder) => {
            const mediaFiles = folderMediaMap.get(folder.id) || [];
            const totalFiles = mediaFiles.length;
            const totalSize = mediaFiles.reduce(
              (sum: number, media: any) => sum + (media.file_size || 0),
              0
            );
            const videoCount = mediaFiles.filter(
              (file: any) => file.file_type === "video"
            ).length;
            const imageCount = mediaFiles.filter(
              (file: any) => file.file_type === "image"
            ).length;
            const lastUpload =
              mediaFiles.length > 0
                ? mediaFiles.sort(
                    (a: any, b: any) =>
                      new Date(b.uploaded_at).getTime() -
                      new Date(a.uploaded_at).getTime()
                  )[0].uploaded_at
                : null;

            // Get first 4 media files for thumbnail display
            const displayMedia = mediaFiles
              .filter((file: any) => file.file_type === "image") // Prioritize images for thumbnails
              .slice(0, 4);

            return {
              id: folder.id,
              type: "folder" as const,
              title: folder.name,
              subtitle: `${folder.projects.name} • ${totalFiles} file${totalFiles !== 1 ? "s" : ""}`,
              url: `/dashboard/projects/${folder.project_id}/folders/${folder.id}`,
              status: "active",
              created_at: folder.created_at,
              updated_at: folder.updated_at,
              projectName: folder.projects.name,
              projectId: folder.project_id,
              parentFolderId: folder.parent_folder_id,
              description: folder.description,
              totalFiles,
              totalSize,
              videoCount,
              imageCount,
              lastUpload,
              folderMediaFiles: displayMedia,
            };
          })
        );
      }
    }
  }

  // Search media if type is "all" or "media"
  if (filters.type === "all" || filters.type === "media") {
    // Get user's accessible projects
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
      // Search media in accessible projects
      let mediaQuery = supabase
        .from("project_media")
        .select(
          `
        id,
        filename,
        original_filename,
        file_type,
        mime_type,
        file_size,
        r2_url,
        uploaded_at,
        status,
        project_id,
        folder_id,
        thumbnail_r2_url
      `
        )
        .in("project_id", userProjects);

      if (term.trim()) {
        mediaQuery = mediaQuery.or(
          `original_filename.ilike.%${term}%,filename.ilike.%${term}%`
        );
      }

      // Apply media type filter
      if (filters.mediaType && filters.mediaType !== "all") {
        switch (filters.mediaType) {
          case "video":
            mediaQuery = mediaQuery.eq("file_type", "video");
            break;
          case "image":
            mediaQuery = mediaQuery
              .eq("file_type", "image")
              .neq("mime_type", "image/svg+xml");
            break;
          case "svg":
            mediaQuery = mediaQuery.eq("mime_type", "image/svg+xml");
            break;
          case "audio":
            mediaQuery = mediaQuery.like("mime_type", "audio/%");
            break;
          case "document":
            mediaQuery = mediaQuery.or(
              `mime_type.eq.application/pdf,mime_type.like.%document%,mime_type.like.%presentation%,mime_type.eq.text/plain`
            );
            break;
        }
      }

      if (filters.status && filters.status !== "all") {
        mediaQuery = mediaQuery.eq("status", filters.status);
      }

      const { data: media } = await mediaQuery;

      if (media && media.length > 0) {
        // Get project names and folder names for the media
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", [...new Set(media.map((m) => m.project_id))]);

        const folderIds = [
          ...new Set(media.map((m) => m.folder_id).filter(Boolean)),
        ];
        const { data: folders } =
          folderIds.length > 0
            ? await supabase
                .from("project_folders")
                .select("id, name")
                .in("id", folderIds)
            : { data: [] };

        const projectMap = new Map(projects?.map((p) => [p.id, p.name]) || []);
        const folderMap = new Map(folders?.map((f) => [f.id, f.name]) || []);

        results.push(
          ...media.map((item) => {
            const folderName = item.folder_id
              ? folderMap.get(item.folder_id)
              : null;
            const projectName = projectMap.get(item.project_id) || "Unknown";

            let subtitle = `Project: ${projectName}`;
            if (folderName) {
              subtitle += ` • Folder: ${folderName}`;
            }

            return {
              id: item.id,
              type: "media" as const,
              title: item.original_filename,
              subtitle,
              url: `/dashboard/projects/${item.project_id}?media=${item.id}`,
              status: item.status,
              mediaType: getMediaTypeFromMimeType(
                item.mime_type || item.file_type
              ),
              mimeType: item.mime_type,
              fileSize: item.file_size,
              projectName,
              projectId: item.project_id,
              mediaUrl: `/media/${item.id}`,
              thumbnailUrl: item.thumbnail_r2_url,
              r2_url: item.r2_url,
              uploadedAt: item.uploaded_at,
              created_at: item.uploaded_at,
              updated_at: item.uploaded_at,
              original_filename: item.original_filename,
            };
          })
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
        const aSize = a.fileSize || a.totalSize || 0;
        const bSize = b.fileSize || b.totalSize || 0;
        return filters.sortOrder === "asc" ? aSize - bSize : bSize - aSize;
      case "created_at":
      case "updated_at":
      default:
        const aDate = a.updated_at || a.created_at || new Date().toISOString();
        const bDate = b.updated_at || b.created_at || new Date().toISOString();
        return filters.sortOrder === "asc"
          ? new Date(aDate).getTime() - new Date(bDate).getTime()
          : new Date(bDate).getTime() - new Date(aDate).getTime();
    }
  });

  return results.slice(0, 50);
};
