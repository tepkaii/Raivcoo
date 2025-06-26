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
