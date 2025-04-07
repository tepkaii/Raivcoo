// app/clients/ClientForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ClientFormProps {
  createClient: (
    formData: FormData
  ) => Promise<{ message: string; client: any }>;
  initialData?: {
    id: string;
    name: string;
    email: string;
    company: string;
    phone: string;
    notes: string;
  };
  updateClient?: (
    clientId: string,
    formData: FormData
  ) => Promise<{ message: string; client: any }>;
}

export default function ClientForm({
  createClient,
  initialData,
  updateClient,
}: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (isEditing && updateClient) {
        await updateClient(initialData.id, formData);
        toast({
          title: "Success",
          description: "Client updated successfully",
          variant: "success",
        });
      } else {
        const result = await createClient(formData);
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
      }

      router.push("/clients");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Client Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="Enter client name"
              required
              defaultValue={initialData?.name || ""}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="client@example.com"
              defaultValue={initialData?.email || ""}
            />
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              type="text"
              id="company"
              name="company"
              placeholder="Company name"
              defaultValue={initialData?.company || ""}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Phone number"
              defaultValue={initialData?.phone || ""}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional notes..."
              rows={4}
              defaultValue={initialData?.notes || ""}
            />
          </div>

          <RevButtons
            type="submit"
            variant="success"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Client"
            ) : (
              "Create Client"
            )}
          </RevButtons>
        </form>
      </CardContent>
    </Card>
  );
}
