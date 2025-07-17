// app/dashboard/projects/[id]/folders/components/EditFolderDialog.tsx
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
import { ProjectFolder } from "@/app/dashboard/lib/types";
import { updateFolderAction } from "../../lib/FolderActions";
import { toast } from "@/hooks/use-toast";

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ProjectFolder;
  projectId: string;
  onFolderUpdated: (folder: ProjectFolder) => void;
}

export function EditFolderDialog({
  open,
  onOpenChange,
  folder,
  projectId,
  onFolderUpdated,
}: EditFolderDialogProps) {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || "");
  const [color, setColor] = useState(folder.color);
  const [isUpdating, setIsUpdating] = useState(false);

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

    setIsUpdating(true);
    try {
      const result = await updateFolderAction(projectId, folder.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });

      if (result.success) {
        onFolderUpdated({
          ...folder,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });
        toast({
          title: "Folder Updated",
          description: `"${name}" has been updated successfully`,
          variant: "green",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to Update Folder",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
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
                    color === colorOption
                      ? "border-gray-900"
                      : "border-gray-300"
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
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim()}>
              {isUpdating ? "Updating..." : "Update Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
