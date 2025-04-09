// app/projects/ProjectEditDialog.tsx
"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { updateProject } from "./actions";

// Type for project data needed for editing
export type ProjectDataForEdit = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
};

interface ProjectEditDialogProps {
  project: ProjectDataForEdit;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ProjectEditDialog({
  project,
  isOpen,
  setIsOpen,
}: ProjectEditDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formattedDeadline = project.deadline
    ? new Date(project.deadline).toISOString().split("T")[0]
    : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await updateProject(project.id, formData); // Use updateProject action
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
        setIsOpen(false);
        router.refresh(); // Refresh parent page data
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>
            Update details for "{project.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Title Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={project.title}
              className="col-span-3"
              required
            />
          </div>
          {/* Description Textarea */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project.description ?? ""}
              className="col-span-3"
              rows={4}
              placeholder="Optional project description..."
            />
          </div>
          {/* Deadline Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadline" className="text-right">
              Deadline
            </Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={formattedDeadline}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
