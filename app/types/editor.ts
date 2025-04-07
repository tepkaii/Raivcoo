// editors/[name]/editor.ts


export interface Language {
  language: string;
  level: string;
}

export interface SoftwareProficiency {
  software: string;
  yearsOfExperience: number;
}

export interface EditorProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string;
  email: string;
  avatar_url: string;
  biography: string;
  is_verified: boolean;
  is_published: boolean;
  account_status: string;
  availability: boolean;
  languages: { language: string; level: string }[];
  skills: string[];
  preferred_genres: string[];
  software_proficiency: { software: string; yearsOfExperience: number }[];
}
