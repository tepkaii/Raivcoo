// app/dashboard/projects/[id]/handlers/folderHandlers.ts
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ProjectFolder } from "@/app/dashboard/types";
import { getFoldersAction } from "../lib/FolderActions";

export const createFolderHandlers = (
  projectId: string,
  folders: ProjectFolder[],
  setFolders: (folders: ProjectFolder[]) => void,
  setIsLoadingFolders: (loading: boolean) => void,
  setCreateFolderOpen: (open: boolean) => void
) => {
  const router = useRouter();

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const result = await getFoldersAction(projectId);
      if (result.success) {
        setFolders(result.folders);
      } else {
        toast({
          title: "Failed to Load Folders",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleFolderClick = (folder: ProjectFolder) => {
    router.push(`/dashboard/projects/${projectId}/folders/${folder.id}`);
  };

  const handleGoToFolders = () => {
    router.push(`/dashboard/projects/${projectId}/folders`);
  };

  const handleFolderCreated = (newFolder: ProjectFolder) => {
    setFolders([...folders, newFolder]);
    setCreateFolderOpen(false);
  };

  const handleFoldersUpdate = (updatedFolders: ProjectFolder[]) => {
    setFolders(updatedFolders);
  };

  return {
    loadFolders,
    handleFolderClick,
    handleGoToFolders,
    handleFolderCreated,
    handleFoldersUpdate,
  };
};
