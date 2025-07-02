// app/dashboard/projects/[id]/components/media/ProjectReferencesDialog.tsx (NEW FILE)
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProjectReference {
  id: string;
  url: string;
  title?: string;
  customName?: string;
  favicon?: string;
  addedAt: string;
}

interface ProjectReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectReferences: ProjectReference[];
  projectName: string;
}

export function ProjectReferencesDialog({
  open,
  onOpenChange,
  projectReferences,
  projectName,
}: ProjectReferencesDialogProps) {
  const handleCopyUrl = async (url: string, title?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: `URL for "${title || url}" copied to clipboard`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Project References - {truncateText(projectName, 30)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!projectReferences || projectReferences.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No References</h3>
              <p className="text-sm text-muted-foreground">
                This project doesn't have any reference links yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {projectReferences.length} reference
                {projectReferences.length === 1 ? "" : "s"} for this project
              </p>

              <div className="space-y-2">
                {projectReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Favicon */}
                    {reference.favicon && (
                      <img
                        src={reference.favicon}
                        alt=""
                        className="w-5 h-5 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {!reference.favicon && (
                      <Link2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm truncate"
                        title={reference.title || reference.url}
                      >
                        {truncateText(
                          reference.title ||
                            reference.customName ||
                            reference.url,
                          60
                        )}
                      </div>
                      {reference.title && reference.title !== reference.url && (
                        <div
                          className="text-xs text-muted-foreground truncate"
                          title={reference.url}
                        >
                          {truncateText(reference.url, 70)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyUrl(reference.url, reference.title)
                        }
                        className="h-8 w-8 p-0"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenUrl(reference.url)}
                        className="h-8 w-8 p-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
