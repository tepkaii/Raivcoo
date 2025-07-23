// app/dashboard/projects/[id]/handlers/reviewLinkHandlers.ts
// @ts-nocheck
import { toast } from "@/hooks/use-toast";
import { MediaFile, ReviewLink } from "@/app/dashboard/types";
import {
  createReviewLinkAction,
  getReviewLinksAction,
  toggleReviewLinkAction,
  updateReviewLinkAction,
  deleteReviewLinkAction,
} from "../lib/GeneralActions";

export const createReviewLinkHandlers = (
  projectId: string,
  reviewLinks: ReviewLink[],
  onReviewLinksUpdated: (links: ReviewLink[]) => void,
  setCreateLinkDialog: (dialog: any) => void,
  setViewLinksDialog: (dialog: any) => void,
  setManageLinksDialog: (dialog: any) => void
) => {
  const handleCreateReviewLink = async (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
    }
  ) => {
    setCreateLinkDialog((prev: any) => ({ ...prev, isCreating: true }));

    const result = await createReviewLinkAction(
      projectId,
      mediaFile.id,
      options
    );

    if (result.success) {
      try {
        await navigator.clipboard.writeText(result.reviewUrl!);
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }

      const updatedLinks = [...reviewLinks, result.reviewLink];
      onReviewLinksUpdated(updatedLinks);

      setCreateLinkDialog((prev: any) => ({
        ...prev,
        isCreating: false,
        showSuccess: true,
        createdUrl: result.reviewUrl,
      }));

      toast({
        title: "Review Link Created",
        description: "Review link has been copied to your clipboard!",
        variant: "green",
      });
    } else {
      setCreateLinkDialog((prev: any) => ({ ...prev, isCreating: false }));
      toast({
        title: "Failed to Create Review Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleViewReviewLinks = async (mediaFile: MediaFile) => {
    setViewLinksDialog({ open: true, mediaFile, links: [], isLoading: true });

    const result = await getReviewLinksAction(projectId, mediaFile.id);

    if (result.success) {
      setViewLinksDialog((prev: any) => ({
        ...prev,
        links: result.links || [],
        isLoading: false,
      }));
    } else {
      toast({
        title: "Failed to Load Review Links",
        description: result.error,
        variant: "destructive",
      });
      setViewLinksDialog({ open: false, links: [], isLoading: false });
    }
  };

  const handleManageReviewLinks = async (mediaFile: MediaFile) => {
    setManageLinksDialog({ open: true, mediaFile, links: [], isLoading: true });

    const result = await getReviewLinksAction(projectId, mediaFile.id);

    if (result.success) {
      setManageLinksDialog((prev: any) => ({
        ...prev,
        links: result.links || [],
        isLoading: false,
      }));
    } else {
      toast({
        title: "Failed to Load Review Links",
        description: result.error,
        variant: "destructive",
      });
      setManageLinksDialog({ open: false, links: [], isLoading: false });
    }
  };

  const handleToggleReviewLink = async (
    linkId: string,
    currentStatus: boolean
  ) => {
    const result = await toggleReviewLinkAction(linkId, !currentStatus);

    if (result.success) {
      const updateLinks = (links: ReviewLink[]) =>
        links.map((link) =>
          link.id === linkId ? { ...link, is_active: !currentStatus } : link
        );

      setViewLinksDialog((prev: any) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      setManageLinksDialog((prev: any) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      onReviewLinksUpdated(updateLinks(reviewLinks));

      toast({
        title: "Link Updated",
        description: `Review link ${!currentStatus ? "activated" : "deactivated"}`,
        variant: "green",
      });
    } else {
      toast({
        title: "Failed to Update Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleUpdateReviewLink = async (linkId: string, updates: any) => {
    const result = await updateReviewLinkAction(linkId, updates);

    if (result.success) {
      const updateLinks = (links: ReviewLink[]) =>
        links.map((link) =>
          link.id === linkId ? { ...link, ...updates } : link
        );

      setManageLinksDialog((prev: any) => ({
        ...prev,
        links: updateLinks(prev.links),
      }));

      onReviewLinksUpdated(updateLinks(reviewLinks));
    } else {
      toast({
        title: "Failed to Update Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteReviewLink = async (linkId: string) => {
    const result = await deleteReviewLinkAction(linkId);

    if (result.success) {
      const filterLinks = (links: ReviewLink[]) =>
        links.filter((link) => link.id !== linkId);

      setViewLinksDialog((prev: any) => ({
        ...prev,
        links: filterLinks(prev.links),
      }));

      setManageLinksDialog((prev: any) => ({
        ...prev,
        links: filterLinks(prev.links),
      }));

      onReviewLinksUpdated(filterLinks(reviewLinks));

      toast({
        title: "Link Deleted",
        description: "Review link has been deleted",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Failed to Delete Link",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return {
    handleCreateReviewLink,
    handleViewReviewLinks,
    handleManageReviewLinks,
    handleToggleReviewLink,
    handleUpdateReviewLink,
    handleDeleteReviewLink,
  };
};
