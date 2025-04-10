// app/clients/[id]/ClientManageDialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { updateClient, deleteClient } from "../actions"; // Import actions from the new file
import Link from "next/link"; // Import Link for New Project button

// Define the shape of the client data needed
type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

interface ClientManageDialogProps {
  client: ClientData;
}

export function ClientManageDialog({ client }: ClientManageDialogProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  // Handle Edit Form Submission
  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startEditTransition(async () => {
      try {
        const result = await updateClient(client.id, formData);
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
        setIsEditOpen(false);
        router.refresh(); // Refresh client detail page data
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    startDeleteTransition(async () => {
      try {
        const result = await deleteClient(client.id);
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
        setIsDeleteOpen(false);
        router.push("/clients"); // Redirect to clients list after successful deletion
        router.refresh(); // Also trigger refresh for safety
      } catch (error: any) {
        toast({
          title: "Deletion Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsDeleteOpen(false); // Close dialog even on error
      }
    });
  };

  // Prevent dropdown closing when opening dialogs
  const handleSelect = (event: Event) => event.preventDefault();

  return (
    <>
      {/* Action Buttons Group */}
      <div className="flex items-center gap-2">
        {/* Link to create a new project for THIS client */}
        <Link href={`/projects/new?client=${client.id}`} passHref>
          <Button variant="success" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>

        {/* Dropdown for Edit/Delete */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Client Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                handleSelect(e);
                setIsEditOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Client Details</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
              onSelect={(e) => {
                handleSelect(e);
                setIsDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Client</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Client Details</DialogTitle>
            <DialogDescription>
              Make changes to "{client.name}". Click save when done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={client.name}
                className="col-span-3"
                required
              />
            </div>
            {/* Company */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                defaultValue={client.company ?? ""}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email ?? ""}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            {/* Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client.phone ?? ""}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            {/* Notes */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client.notes ?? ""}
                className="col-span-3"
                rows={3}
                placeholder="Optional client notes..."
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isEditPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isEditPending}>
                {isEditPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              client
              <strong className="mx-1">"{client.name}"</strong>. Associated
              projects **may also be deleted** depending on database settings
              (cascade). Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletePending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
