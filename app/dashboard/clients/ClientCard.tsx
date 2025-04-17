// app/clients/ClientCard.tsx (or components/clients/ClientCard.tsx)
"use client";

import { useState, ChangeEvent, FormEvent } from "react"; // Added ChangeEvent, FormEvent
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { deleteClient, updateClient } from "./actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define a more complete type for the client data needed for editing

type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null; // Added phone
  notes: string | null; // Added notes
  projects: { id: string }[] | null;
};

// Type for the form data state
type EditFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
};

// Define the type for the server action responses
type ServerActionResult = {
  success: boolean;
  message: string;
  // Delete specific fields
  hasProjects?: boolean;
  projectCount?: number;
  forceDeletedProjects?: boolean;
  // Update specific fields
  client?: ClientData; // Assuming update returns the updated client
};

interface ClientCardProps {
  client: ClientData; // Use the more complete type
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter();

  // State for Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteState, setDeleteState] = useState({
    loading: false,
    error: null as string | null,
  });

  // State for Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: client.name ?? "",
    email: client.email ?? "",
    company: client.company ?? "",
    phone: client.phone ?? "",
    notes: client.notes ?? "",
  });
  const [updateState, setUpdateState] = useState({
    loading: false,
    error: null as string | null,
  });

  // --- Delete Logic ---
  const handleDelete = async (forceDelete: boolean = false) => {
    setDeleteState({ loading: true, error: null });
    try {
      const result: ServerActionResult = await deleteClient(
        client.id,
        forceDelete
      );
      if (result.hasProjects && !forceDelete && !result.success) {
        setDeleteState({ loading: false, error: result.message });
        return;
      }
      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        setDeleteState({ loading: false, error: result.message });
      }
    } catch (error) {
      console.error("Error calling deleteClient action:", error);
      setDeleteState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error during delete.",
      });
    }
  };

  // --- Edit Logic ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateState({ loading: true, error: null });

    // Create FormData to send to the server action
    const formData = new FormData();
    formData.append("name", editFormData.name);
    formData.append("email", editFormData.email);
    formData.append("company", editFormData.company);
    formData.append("phone", editFormData.phone);
    formData.append("notes", editFormData.notes);

    try {
      const result = await updateClient(client.id, formData); // Call server action
      if (result.message.includes("success")) {
        // Simple success check based on message
        setShowEditDialog(false);
        router.refresh(); // Refresh data on the page
        // Optionally show success toast
      } else {
        // If the action resolves but indicates failure (e.g., validation)
        setUpdateState({
          loading: false,
          error: result.message || "Failed to update client.",
        });
      }
    } catch (error) {
      console.error("Error calling updateClient action:", error);
      // If the action throws an error
      setUpdateState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during update.",
      });
    }
  };

  // Function to initialize/reset edit form state when opening dialog
  const openEditDialog = () => {
    setEditFormData({
      name: client.name ?? "",
      email: client.email ?? "",
      company: client.company ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });
    setUpdateState({ loading: false, error: null }); // Reset errors/loading
    setShowEditDialog(true);
  };

  return (
    <div className="relative group">
      {/* Card Content and Link */}
      <Card className="h-full border-2 hover:shadow-md transition-shadow">
        {/* Link should ideally navigate to a dedicated client page */}
        {/* Or remove the Link wrapper if all actions are via dropdown */}
        <Link
          href={`/dashboard/clients/${client.id}`}
          passHref
          className="block h-full"
        >
          <CardHeader className="pb-2">
            <CardTitle>{client.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {client.company || "N/A"}
            </p>{" "}
            {/* Handle null display */}
            <p className="text-sm text-muted-foreground">
              {client.email || "N/A"}
            </p>{" "}
            {/* Handle null display */}
            <div className="mt-2 flex items-center">
              <div className="bg-muted px-2 py-1 rounded-md text-xs font-medium">
                {client.projects?.length ?? 0} projects
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Dropdown Menu for Actions */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <span className="sr-only">Open client menu</span>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                // Use onSelect to avoid interfering with Dialog trigger logic
                e.preventDefault(); // Prevent any default behavior
                openEditDialog();
              }}
              className="cursor-pointer"
            >
              Edit Client
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/dashboard/clients/${client.id}`}>View Details</Link>{" "}
              {/* Changed link purpose */}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeleteState({ loading: false, error: null });
                setShowDeleteDialog(true);
              }}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
            >
              Delete Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Edit Client Dialog --- */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          {" "}
          {/* Adjust width if needed */}
          <DialogHeader>
            <DialogTitle>Edit Client: {client.name}</DialogTitle>
            <DialogDescription>
              Update the client's details below. Click save when finished.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            {/* Display Update Error */}
            {updateState.error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                {updateState.error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                required
                disabled={updateState.loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
                disabled={updateState.loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={editFormData.company}
                onChange={handleInputChange}
                disabled={updateState.loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={editFormData.phone}
                onChange={handleInputChange}
                disabled={updateState.loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={editFormData.notes}
                onChange={handleInputChange}
                rows={3}
                disabled={updateState.loading}
              />
            </div>
            <DialogFooter className="mt-5">
              {" "}
              {/* Add margin */}
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateState.loading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={updateState.loading || !editFormData.name}
              >
                {" "}
                {/* Disable if loading or no name */}
                {updateState.loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog (Existing) --- */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete {client.name}?</DialogTitle>
            <DialogDescription>
              {deleteState.error
                ? deleteState.error
                : client.projects?.length
                  ? `This client has ${client.projects.length} associated project(s). Deleting the client will also permanently remove all associated projects/tracks/comments (due to cascade rules). This action cannot be undone.`
                  : "This action cannot be undone. The client will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          {deleteState.error &&
            client.projects?.length > 0 &&
            !deleteState.error.includes("project(s)") && (
              <div className="text-red-500 text-sm mt-2 py-2 px-3 bg-red-50 rounded-md border border-red-200">
                {deleteState.error}
              </div>
            )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteState.loading}>
                Cancel
              </Button>
            </DialogClose>
            {(client.projects && client.projects.length > 0) ||
            deleteState.error ? (
              <Button
                variant="destructive"
                onClick={() => handleDelete(true)}
                disabled={deleteState.loading}
              >
                {deleteState.loading ? "Deleting..." : "Delete Client & Data"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleDelete(false)}
                disabled={deleteState.loading}
              >
                {deleteState.loading ? "Deleting..." : "Confirm Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
