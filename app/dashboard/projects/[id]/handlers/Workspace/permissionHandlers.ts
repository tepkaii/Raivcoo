//   app/dashboard/projects/[id]/handlers/Workspace/permissionHandlers.ts
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

export const createPermissionHandlers = (
  userRole: ProjectRole | null,
  isOwner: boolean
) => {
  const canUpload = isOwner || hasPermission(userRole, "canUpload");
  const canDelete = isOwner || hasPermission(userRole, "canDelete");
  const canComment = isOwner || hasPermission(userRole, "canComment");
  const canEditStatus = isOwner || hasPermission(userRole, "canEditStatus");
  const canCreateReviewLinks =
    isOwner || hasPermission(userRole, "canCreateReviewLinks");
  const canManageMembers = isOwner;

  return {
    canUpload,
    canDelete,
    canComment,
    canEditStatus,
    canCreateReviewLinks,
    canManageMembers,
  };
};
