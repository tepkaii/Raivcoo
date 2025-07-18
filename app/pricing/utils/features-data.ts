// app/pricing/features-data.ts

export interface PricingFeature {
  id: string;
  category: string;
  feature: string;
  description?: string;
  free: boolean | string | number;
  lite: boolean | string | number;
  pro: boolean | string | number;
  highlight?: boolean;
}

export const featureCategories = {
  storage: "Storage & Upload",
  projects: "Projects & Organization",
  collaboration: "Collaboration",
  review: "Review & Feedback",
  security: "Security & Sharing",
  notifications: "Notifications",
  support: "Support",
} as const;

export const pricingFeatures: PricingFeature[] = [
  // Storage & Upload
  {
    id: "storage",
    category: featureCategories.storage,
    feature: "Storage Space",
    free: "500MB",
    lite: "50GB - 150GB",
    pro: "250GB - 2TB",
    highlight: true,
  },
  {
    id: "max_upload",
    category: featureCategories.storage,
    feature: "Max Upload Size",
    free: "200MB",
    lite: "2GB",
    pro: "5GB",
    highlight: true,
  },
  {
    id: "media_formats",
    category: featureCategories.storage,
    feature: "Supported Media",
    description: "Videos, images, audio, documents, SVG files",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "flexible_storage",
    category: featureCategories.storage,
    feature: "Pay-as-you-Scale Storage",
    description: "Only pay for the storage you actually use",
    free: false,
    lite: true,
    pro: true,
  },

  // Projects & Organization
  {
    id: "active_projects",
    category: featureCategories.projects,
    feature: "Active Projects",
    free: 2,
    lite: "Unlimited",
    pro: "Unlimited",
    highlight: true,
  },
  {
    id: "folders",
    category: featureCategories.projects,
    feature: "Folder Organization",
    description: "Create nested folders, upload folder structures",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "global_search",
    category: featureCategories.projects,
    feature: "Global Search (⌘K)",
    description: "Search across all projects, media files, comments",
    free: true,
    lite: true,
    pro: true,
  },

  // Collaboration
  {
    id: "members_per_project",
    category: featureCategories.collaboration,
    feature: "Members per Project",
    free: 2,
    lite: "Unlimited",
    pro: "Unlimited",
    highlight: true,
  },
  {
    id: "role_permissions",
    category: featureCategories.collaboration,
    feature: "User Roles & Permissions",
    description:
      "Viewer, Reviewer, Collaborator roles with specific permissions",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "guest_access",
    category: featureCategories.collaboration,
    feature: "Guest Access (No Signup)",
    description: "Clients can view and comment without creating accounts",
    free: true,
    lite: true,
    pro: true,
  },

  // Review & Feedback
  {
    id: "annotations",
    category: featureCategories.review,
    feature: "Pin & Draw Annotations",
    description: "Pin comments to exact frames, draw directly on media",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "timestamped_comments",
    category: featureCategories.review,
    feature: "Timestamped Comments",
    description: "Frame-accurate video comments with timeline sync",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "version_control",
    category: featureCategories.review,
    feature: "Version Control",
    description: "Drag & drop versions, track revisions, compare changes",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "review_links",
    category: featureCategories.review,
    feature: "Review Links",
    description: "Share media for feedback without client signup",
    free: true,
    lite: true,
    pro: true,
  },

  // Security & Sharing
  {
    id: "password_protection",
    category: featureCategories.security,
    feature: "Password Protected Links",
    free: false,
    lite: true,
    pro: true,
    highlight: true,
  },
  {
    id: "custom_expiration",
    category: featureCategories.security,
    feature: "Custom Link Expiration",
    description: "Set when review links expire",
    free: false,
    lite: true,
    pro: true,
  },
  {
    id: "download_controls",
    category: featureCategories.security,
    feature: "Download Controls",
    description: "Control who can download original files",
    free: false,
    lite: false,
    pro: true,
  },

  // Notifications
  {
    id: "notification_system",
    category: featureCategories.notifications,
    feature: "Smart Notifications",
    description:
      "In-app + email notifications for comments, uploads, status changes",
    free: true,
    lite: true,
    pro: true,
  },
  {
    id: "notification_controls",
    category: featureCategories.notifications,
    feature: "Notification Controls",
    description: "Disable notifications per project or per account",
    free: true,
    lite: true,
    pro: true,
  },

  // Support
  {
    id: "support_level",
    category: featureCategories.support,
    feature: "Support Level",
    free: "Email Support",
    lite: "Priority Email Support",
    pro: "Priority Email Support",
  },
];

// Helper functions
export const getFeaturesByCategory = (category: string) => {
  return pricingFeatures.filter((feature) => feature.category === category);
};

export const getAllCategories = () => {
  return Object.values(featureCategories);
};

export const getHighlightedFeatures = () => {
  return pricingFeatures.filter((feature) => feature.highlight);
};

// Format feature values for display
export const formatFeatureValue = (
  value: boolean | string | number
): string => {
  if (typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return value;
};

// Get feature value with styling classes
export const getFeatureValueClasses = (
  value: boolean | string | number,
  plan: "free" | "lite" | "pro"
) => {
  const baseClasses = "text-center py-3 px-2";

  if (typeof value === "boolean") {
    return `${baseClasses} ${value ? "text-green-600 text-lg" : "text-gray-400"}`;
  }

  return `${baseClasses} text-foreground font-medium`;
};
