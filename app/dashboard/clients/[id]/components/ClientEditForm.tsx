// components/clients/ClientEditForm.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateClient } from "../../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RevButtons } from "@/components/ui/RevButtons";

// Type for the client data needed for the form
type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

// Type for the form data state
type EditFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
};

interface ClientEditFormProps {
  clientId: string;
  initialData: ClientData;
  onSaveSuccess?: () => void; // Callback on successful save
  onCancel?: () => void; // Callback for cancel action
}

export function ClientEditForm({
  clientId,
  initialData,
  onSaveSuccess,
  onCancel,
}: ClientEditFormProps) {
  const router = useRouter();
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: initialData.name ?? "",
    email: initialData.email ?? "",
    company: initialData.company ?? "",
    phone: initialData.phone ?? "",
    notes: initialData.notes ?? "",
  });
  const [updateState, setUpdateState] = useState({
    loading: false,
    error: null as string | null,
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFormData.name) {
      setUpdateState({ loading: false, error: "Client name is required." });
      return;
    }
    setUpdateState({ loading: true, error: null });

    const formData = new FormData();
    formData.append("name", editFormData.name);
    formData.append("email", editFormData.email);
    formData.append("company", editFormData.company);
    formData.append("phone", editFormData.phone);
    formData.append("notes", editFormData.notes);

    try {
      const result = await updateClient(clientId, formData);
      if (result.message?.toLowerCase().includes("success")) {
        router.refresh(); // Refresh server data for the page
        onSaveSuccess?.(); // Call success callback (e.g., close dialog)
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

  return (
    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
      {/* Display Update Error */}
      {updateState.error && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
          {updateState.error}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`edit-name-${clientId}`}>
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`edit-name-${clientId}`} // Unique ID using clientId
          name="name"
          value={editFormData.name}
          onChange={handleInputChange}
          required
          disabled={updateState.loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`edit-email-${clientId}`}>Email</Label>
        <Input
          id={`edit-email-${clientId}`}
          name="email"
          type="email"
          value={editFormData.email}
          onChange={handleInputChange}
          disabled={updateState.loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`edit-company-${clientId}`}>Company</Label>
        <Input
          id={`edit-company-${clientId}`}
          name="company"
          value={editFormData.company}
          onChange={handleInputChange}
          disabled={updateState.loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`edit-phone-${clientId}`}>Phone</Label>
        <Input
          id={`edit-phone-${clientId}`}
          name="phone"
          value={editFormData.phone}
          onChange={handleInputChange}
          disabled={updateState.loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`edit-notes-${clientId}`}>Notes</Label>
        <Textarea
          id={`edit-notes-${clientId}`}
          name="notes"
          value={editFormData.notes}
          onChange={handleInputChange}
          rows={3}
          disabled={updateState.loading}
        />
      </div>
      <div className="flex justify-end gap-2 mt-5">
        {" "}
        {/* Use standard div for footer */}
        <RevButtons
          type="button"
          variant="outline"
          onClick={onCancel} // Call cancel callback
          disabled={updateState.loading}
        >
          Cancel
        </RevButtons>
        <RevButtons
          type="submit"
          variant={"success"}
          disabled={updateState.loading || !editFormData.name}
        >
          {updateState.loading ? "Saving..." : "Save Changes"}
        </RevButtons>
      </div>
    </form>
  );
}
