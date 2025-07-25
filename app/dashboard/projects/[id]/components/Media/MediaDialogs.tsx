// app/dashboard/projects/[id]/components/media/MediaDialogs.tsx
// @ts-nocheck
"use client";

import React from "react";
import { CreateReviewLinkDialog } from "../Dialogs/CreateReviewLinkDialog";
import { ManageReviewLinksDialog } from "../Dialogs/ManageReviewLinksDialog";
import { VersionManagerDialog } from "../Dialogs/VersionManagerDialog";
import { DeleteMediaDialog } from "../Dialogs/DeleteMediaDialog";
import { MediaFile, OrganizedMedia } from "@/app/dashboard/types";
import { EditMediaNameDialog } from "../Dialogs/EditMediaNameDialog";

interface ReviewLink {
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

interface MediaDialogsProps {
  createLinkDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isCreating: boolean;
    showSuccess: boolean;
    createdUrl?: string;
  };
  viewLinksDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  };
  manageLinksDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    links: ReviewLink[];
    isLoading: boolean;
  };
  versionManagerDialog: {
    open: boolean;
    media?: OrganizedMedia;
    isUpdating: boolean;
  };
  deleteDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isDeleting: boolean;
  };
  onCreateLinkDialogChange: (dialog: any) => void;
  onViewLinksDialogChange: (dialog: any) => void;
  onManageLinksDialogChange: (dialog: any) => void;
  onVersionManagerDialogChange: (dialog: any) => void;
  onDeleteDialogChange: (dialog: any) => void;
  onCreateReviewLink: (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
    }
  ) => void;
  onToggleReviewLink: (linkId: string, currentStatus: boolean) => void;
  onUpdateReviewLink: (linkId: string, updates: any) => void;
  onDeleteReviewLink: (linkId: string) => void;
  onVersionReorder: (parentId: string, reorderedVersions: MediaFile[]) => void;
  onUpdateVersionName: (versionId: string, name: string) => void;
  onDeleteVersion: (versionId: string) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
  projectId: string;
  onMediaUpdated: (updatedMedia: MediaFile[]) => void;
  editNameDialog: {
    open: boolean;
    mediaFile?: MediaFile;
    isUpdating: boolean;
  };
  onEditNameDialogChange: (dialog: any) => void;
  onRenameMedia?: (mediaFile: MediaFile) => void;
  onReviewLinksUpdated?: (newLinks: ReviewLink[]) => void;
  reviewLinks: ReviewLink[];
}

export function MediaDialogs({
  createLinkDialog,
  manageLinksDialog,
  versionManagerDialog,
  deleteDialog,
  onCreateLinkDialogChange,
  onManageLinksDialogChange,
  onVersionManagerDialogChange,
  onDeleteDialogChange,
  onCreateReviewLink,
  onToggleReviewLink,
  onUpdateReviewLink,
  onDeleteReviewLink,
  onDeleteMedia,
  projectId,
  onMediaUpdated,
  editNameDialog,
  onEditNameDialogChange,
  onReviewLinksUpdated,
  reviewLinks,
}: MediaDialogsProps) {
  return (
    <>
      <CreateReviewLinkDialog
        createLinkDialog={createLinkDialog}
        onCreateLinkDialogChange={onCreateLinkDialogChange}
        onCreateReviewLink={onCreateReviewLink}
      />

      <ManageReviewLinksDialog
        manageLinksDialog={manageLinksDialog}
        onManageLinksDialogChange={onManageLinksDialogChange}
        onToggleReviewLink={onToggleReviewLink}
        onUpdateReviewLink={onUpdateReviewLink}
        onDeleteReviewLink={onDeleteReviewLink}
        onReviewLinksUpdated={onReviewLinksUpdated}
        reviewLinks={reviewLinks}
        projectId={projectId} // ✅ Add this
      />
      <VersionManagerDialog
        versionManagerDialog={versionManagerDialog}
        onVersionManagerDialogChange={onVersionManagerDialogChange}
        projectId={projectId}
        onMediaUpdated={onMediaUpdated}
      />

      <DeleteMediaDialog
        deleteDialog={deleteDialog}
        onDeleteDialogChange={onDeleteDialogChange}
        onDeleteMedia={onDeleteMedia}
      />
      <EditMediaNameDialog
        editNameDialog={editNameDialog}
        onEditNameDialogChange={onEditNameDialogChange}
        projectId={projectId}
        onMediaUpdated={onMediaUpdated}
      />
    </>
  );
}
