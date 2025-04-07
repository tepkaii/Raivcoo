// types/editorProfile.ts


import { PortfolioItem } from "../portfolio/types";

export interface Language {
  language: string;
  level: string;
}
export type VideoSource =
  | "YouTube"
  | "Vimeo"
  | "TikTok"
  | "Instagram"
  | "Dropbox"
  | "Google Drive"
  | "Other";
export type VideoType = "Short" | "Long";
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface SoftwareProficiency {
  software: string;
  yearsOfExperience: number;
}

export interface OGImage {
  id: string;
  url: string | null;
  template: string | null;
  alt: string;
  lastUpdated: string;
  type: "custom" | "template";
  dimensions: {
    width: number;
    height: number;
  };
}



export interface EditorProfile {
  preview_font: string;
  password_data: any;
  og_image: OGImage | null;
  linktree_settings?: LinkTreeSettings;
  is_verified: boolean;
  id: string;
  favicon_url?: string; // Added favicon_url field
  email: any;
  availability: any;
  user_id: string;
  title?: string;
  full_name: string;
  display_name: string;
  country: string;
  biography: string;
  avatar_url: string;
  languages: { language: string; level: string }[];
  skills: string[];
  preferred_genres: string[];
  software_proficiency: { software: string; yearsOfExperience: number }[];
  is_published: boolean;
  account_status: string;
  portfolio_items?: PortfolioItem[];
}

export interface LinkTreeSettings {
  theme: string;
  links: Array<{ title: string; url: string; color: string }>;
}
export interface PreviewContentProps {
  portfolio: EditorProfile;
  email: string | undefined;
 
}
export interface EditorPortfolioProps {
  portfolio: EditorProfile;
  email: string | undefined;
  updatePortfolio: (formData: FormData) => Promise<{
    message: string;
    updatedPortfolio: EditorProfile | null;
  }>;
}
