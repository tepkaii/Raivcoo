// app/clients/[id]/ClientDetailActions.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons"; // Assuming this is your custom button
import { Edit, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientEditForm } from "./ClientEditForm"; // Import the form

// Type for the client data passed from the page
type ClientData = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  // Add other fields if needed by the form or display
};

interface ClientDetailActionsProps {
  client: ClientData;
}

export function ClientDetailActions({ client }: ClientDetailActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        {/* Edit Button - Opens Dialog */}
        <RevButtons variant="outline" onClick={() => setShowEditDialog(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </RevButtons>

        {/* New Project Button - Remains a Link */}
        <Link href={`/dashboard/projects/new?client=${client.id}`} passHref>
          <RevButtons variant="success">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </RevButtons>
        </Link>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client: {client.name}</DialogTitle>
            <DialogDescription>
              Update the client's details below. Click save when finished.
            </DialogDescription>
          </DialogHeader>
          {/* Render the reusable form */}
          <ClientEditForm
            clientId={client.id}
            initialData={client}
            onSaveSuccess={() => setShowEditDialog(false)} // Close dialog on success
            onCancel={() => setShowEditDialog(false)} // Close dialog on cancel
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
