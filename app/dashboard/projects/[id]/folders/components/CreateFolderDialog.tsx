// app/dashboard/projects/[id]/folders/components/CreateFolderDialog.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectFolder } from "@/app/dashboard/types";
import { createFolderAction } from "../../lib/FolderActions";
import { toast } from "@/hooks/use-toast";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  parentFolderId?: string;
  onFolderCreated: (folder: ProjectFolder) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  projectId,
  parentFolderId,
  onFolderCreated,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isCreating, setIsCreating] = useState(false);

  const colors = [
    "#3B82F6",
    "#8B5CF6",
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#F97316",
    "#EC4899",
    "#6B7280",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const result = await createFolderAction(
        projectId,
        name.trim(),
        description.trim() || undefined,
        parentFolderId,
        color
      );

      if (result.success) {
        onFolderCreated(result.folder);
        toast({
          title: "Folder Created",
          description: `"${name}" has been created successfully`,
          variant: "green",
        });
        setName("");
        setDescription("");
        setColor("#3B82F6");
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to Create Folder",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter folder description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === colorOption ? " border-gray-300" : ""
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
