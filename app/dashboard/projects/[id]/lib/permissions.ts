// lib/permissions.ts
export type ProjectRole = "viewer" | "reviewer" | "collaborator";

export const ROLE_PERMISSIONS = {
  viewer: {
    canView: true,
    canComment: false,
    canUpload: false,
    canDelete: false,
    canEditStatus: false,
    canCreateReviewLinks: false,
    canManageMembers: false,
  },
  reviewer: {
    canView: true,
    canComment: true,
    canUpload: false,
    canDelete: false,
    canEditStatus: true,
    canCreateReviewLinks: false,
    canManageMembers: false,
  },
  collaborator: {
    canView: true,
    canComment: true,
    canUpload: true,
    canDelete: true,
    canEditStatus: true,
    canCreateReviewLinks: true,
    canManageMembers: false,
  },
} as const;

export function hasPermission(
  role: ProjectRole | null,
  permission: keyof typeof ROLE_PERMISSIONS.viewer
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

export function canUserPerformAction(
  userRole: ProjectRole | null,
  action: keyof typeof ROLE_PERMISSIONS.viewer
): boolean {
  if (!userRole) return false;
  return hasPermission(userRole, action);
}

export interface UserPermissions {
  canView: boolean;
  canComment: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canEditStatus: boolean;
  canCreateReviewLinks: boolean;
  canManageMembers: boolean;
}

export function getUserPermissions(
  role: ProjectRole | null,
  isOwner: boolean = false
): UserPermissions {
  if (isOwner) {
    return {
      canView: true,
      canComment: true,
      canUpload: true,
      canDelete: true,
      canEditStatus: true,
      canCreateReviewLinks: true,
      canManageMembers: true,
    };
  }

  if (!role) {
    return {
      canView: false,
      canComment: false,
      canUpload: false,
      canDelete: false,
      canEditStatus: false,
      canCreateReviewLinks: false,
      canManageMembers: false,
    };
  }

  return ROLE_PERMISSIONS[role];
}
