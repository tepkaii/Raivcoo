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
export const MEDIA_STATUS_OPTIONS = [
  { value: "on_hold", label: "On Hold", color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "needs_review", label: "Needs Review", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
] as const;

export const getStatusConfig = (status: string) => {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status) || {
      value: status,
      label: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "bg-gray-500",
    }
  );
};