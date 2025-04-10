// app/clients/ClientForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ClientFormProps {
  createClient: (
    formData: FormData
  ) => Promise<{ message: string; client: any }>;
  initialData?: {
    id: string;
    name: string;
    email?: string | null;
    company?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
  updateClient?: (
    clientId: string,
    formData: FormData
  ) => Promise<{ message: string; client: any }>;
  potentialClients?: {
    id: string;
    full_name: string;
    email?: string | null;
  }[];
}

export default function ClientForm({
  createClient,
  initialData,
  updateClient,
  potentialClients = [],
}: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof potentialClients>(
    []
  );
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const isEditing = !!initialData;

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = potentialClients.filter(
      (editor) =>
        editor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (editor.email &&
          editor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setSearchResults(results);
  }, [searchTerm, potentialClients]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (isEditing && updateClient && initialData) {
        await updateClient(initialData.id, formData);
        toast({
          title: "Success",
          description: "Client updated successfully",
          variant: "success",
        });
      } else if (!isEditing) {
        const result = await createClient(formData);
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });
      } else {
        throw new Error(
          "Update function not provided or initial data missing for editing."
        );
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

  const handleEditorSelect = (editor: (typeof potentialClients)[0]) => {
    const form = document.getElementById("client-form") as HTMLFormElement;
    if (form) {
      (form.elements.namedItem("name") as HTMLInputElement).value =
        editor.full_name;
      if (editor.email) {
        (form.elements.namedItem("email") as HTMLInputElement).value =
          editor.email;
      }
      setSearchTerm("");
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="relative">
              <div className="flex items-center border rounded-md px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search editor profiles..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                />
                {searchTerm && (
                  <X
                    className="h-4 w-4 text-muted-foreground cursor-pointer"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  />
                )}
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                  {searchResults.map((editor) => (
                    <div
                      key={editor.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => handleEditorSelect(editor)}
                    >
                      <span>{editor.full_name}</span>
                      {editor.email && (
                        <Badge variant="outline" className="text-xs">
                          {editor.email}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rest of the form remains the same */}
          <div>
            <Label htmlFor="name">
              Client Name <span className="text-red-500">*</span>
            </Label>
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