export interface ProjectFolder {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  color: string;
  is_root: boolean;
  display_order: number;
  subfolders?: ProjectFolder[];
  media_count?: number;
}

export interface OrganizedMediaWithFolders extends OrganizedMedia {
  folder_id?: string;
}

export interface FolderUploadData {
  path: string;
  file: File;
  relativePath: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  parent_media_id?: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
  status?: string;
  thumbnail_r2_key?: string; // New
  thumbnail_r2_url?: string; // New
  thumbnail_generated_at?: string; // New
  display_order?: number;
}

export interface OrganizedMedia {
  parent_media_id?: string;
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
  version_number: number;
  is_current_version: boolean;
  version_name?: string;
  versions: MediaFile[];
  currentVersion: MediaFile;
  hasReviewLinks: boolean;
}

export interface ReviewLink {
  allow_download: any;
  id: string;
  link_token: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  media_id: string;
  password_hash?: string;
  requires_password: boolean;
}
