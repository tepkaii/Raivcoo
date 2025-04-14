// app/projects/ProjectActionsDropdown.tsx
"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ProjectEditDialog, ProjectDataForEdit } from "./ProjectEditDialog";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog"; // Import Delete dialog
import { RevButtons } from "@/components/ui/RevButtons";

// Define the shape of the project data needed
export type ProjectDataForActions = ProjectDataForEdit; // Use the type from edit dialog

interface ProjectActionsDropdownProps {
  project: ProjectDataForActions;
}

export function ProjectActionsDropdown({
  project,
}: ProjectActionsDropdownProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Prevent dropdown closing immediately when selecting an item that opens a dialog
  const handleSelect = (event: Event) => event.preventDefault();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <RevButtons
            variant="outline"
            size="icon"
            className="h-8 w-8 data-[state=open]:bg-muted"
          >
            {" "}
            {/* Added open state style */}
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Project Actions</span>
          </RevButtons>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              handleSelect(e);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Details</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500"
            onSelect={(e) => {
              handleSelect(e);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs are rendered but controlled by state */}
      <ProjectEditDialog
        project={project}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
      <ProjectDeleteDialog
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </>
  );
}
