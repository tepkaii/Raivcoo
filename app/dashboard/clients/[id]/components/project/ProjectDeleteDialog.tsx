// app/projects/ProjectDeleteDialog.tsx
"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { deleteProject } from "../../actions"; // Assumes actions.ts is in the same folder

interface ProjectDeleteDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ProjectDeleteDialog({
  projectId,
  projectTitle,
  isOpen,
  setIsOpen,
}: ProjectDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProject(projectId); // Use deleteProject action
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
        setIsOpen(false);
        router.refresh(); // Refresh the list on the parent page
      } catch (error: any) {
        toast({
          title: "Deletion Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsOpen(false);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete project{" "}
            <strong className="mx-1">"{projectTitle}"</strong> and all its data?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
