// app/clients/ClientCard.tsx
// @ts-nocheck
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Mail, Building2, Phone } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RevButtons } from "@/components/ui/RevButtons";

type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at?: string;
  projects: { id: string }[] | null;
};

type EditFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
};

type ServerActionResult = {
  success: boolean;
  message: string;
  hasProjects?: boolean;
  projectCount?: number;
  forceDeletedProjects?: boolean;
  client?: ClientData;
};

interface ClientCardProps {
  client: ClientData;
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

    const formData = new FormData();
    formData.append("name", editFormData.name);
    formData.append("email", editFormData.email);
    formData.append("company", editFormData.company);
    formData.append("phone", editFormData.phone);
    formData.append("notes", editFormData.notes);

    try {
      const result = await updateClient(client.id, formData);
      if (result.message.includes("success")) {
        setShowEditDialog(false);
        router.refresh();
      } else {
        setUpdateState({
          loading: false,
          error: result.message || "Failed to update client.",
        });
      }
    } catch (error) {
      console.error("Error calling updateClient action:", error);
      setUpdateState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during update.",
      });
    }
  };

  const openEditDialog = () => {
    setEditFormData({
      name: client.name ?? "",
      email: client.email ?? "",
      company: client.company ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });
    setUpdateState({ loading: false, error: null });
    setShowEditDialog(true);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative group">
      <Card className="h-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://avatar.vercel.sh/${client.id}.png`} />
              <AvatarFallback>
                {client.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              {client.company && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3 mr-1" />
                  {client.company}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <RevButtons variant="outline" size="icon" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </RevButtons>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  openEditDialog();
                }}
                className="cursor-pointer"
              >
                Edit Client
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteState({ loading: false, error: null });
                  setShowDeleteDialog(true);
                }}
                className="text-red-600 focus:text-red-700 cursor-pointer"
              >
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline" className="px-2 py-0.5">
                {client.projects?.length || 0} project
                {client.projects?.length !== 1 ? "s" : ""}
              </Badge>

              {client.created_at && (
                <span className="text-xs text-muted-foreground">
                  Added {formatDate(client.created_at)}
                </span>
              )}
            </div>

            <div className="pt-2">
              <Link href={`/dashboard/clients/${client.id}`}>
                <RevButtons variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </RevButtons>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Edit Client Dialog --- */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client: {client.name}</DialogTitle>
            <DialogDescription>
              Update the client's details below. Click save when finished.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
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
              <DialogClose asChild>
                <RevButtons
                  type="button"
                  variant="outline"
                  disabled={updateState.loading}
                >
                  Cancel
                </RevButtons>
              </DialogClose>
              <RevButtons
                variant="success"
                type="submit"
                disabled={updateState.loading || !editFormData.name}
              >
                {updateState.loading ? "Saving..." : "Save Changes"}
              </RevButtons>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
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
