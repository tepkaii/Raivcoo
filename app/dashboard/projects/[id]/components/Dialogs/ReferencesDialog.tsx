// app/dashboard/projects/[id]/components/media/ProjectReferencesDialog.tsx (UPDATED FILE)
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  Copy,
  Plus,
  X,
  Loader2,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  createReference,
  isValidReferenceUrl,
  normalizeReferenceUrl,
  parseReferencesFromText,
  ProjectReference,
} from "@/app/review/[token]/lib/reference-links";
import { LinkIcon } from "@heroicons/react/24/solid";

interface ProjectReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectReferences: ProjectReference[];
  projectName: string;
  onReferencesUpdate?: (references: ProjectReference[]) => void;
  readOnly?: boolean;
}

interface EditingReference {
  id: string;
  url: string;
  title: string;
  customName: string;
}

export function ProjectReferencesDialog({
  open,
  onOpenChange,
  projectReferences,
  projectName,
  onReferencesUpdate,
  readOnly = false,
}: ProjectReferencesDialogProps) {
  const [references, setReferences] =
    useState<ProjectReference[]>(projectReferences);
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [editingReference, setEditingReference] =
    useState<EditingReference | null>(null);

  // Update local state when prop changes
  React.useEffect(() => {
    setReferences(projectReferences);
  }, [projectReferences]);

  const handleCopyUrl = async (url: string, title?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: `URL for "${title || url}" copied to clipboard`,
        variant: "green",
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

  const addSingleReference = async () => {
    if (!singleUrl.trim()) return;

    const normalizedUrl = normalizeReferenceUrl(singleUrl);
    if (!isValidReferenceUrl(normalizedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    if (references.some((ref) => ref.url === normalizedUrl)) {
      toast({
        title: "Already Added",
        description: "This URL is already in your references",
        variant: "outline",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newReference = createReference(normalizedUrl);

      // Try to fetch title
      try {
        const response = await fetch(
          `/api/metadata?url=${encodeURIComponent(normalizedUrl)}`
        );
        if (response.ok) {
          const metadata = await response.json();
          if (metadata.title) {
            newReference.title = metadata.title;
          }
        }
      } catch (error) {
        console.log("Could not fetch metadata, using URL as title");
      }

      const updatedReferences = [...references, newReference];
      setReferences(updatedReferences);
      onReferencesUpdate?.(updatedReferences);
      setSingleUrl("");

      toast({
        title: "Reference Added",
        description: `Added: ${truncateText(newReference.title || normalizedUrl, 50)}`,
        variant: "green",
      });
    } catch (error) {
      console.error("Error adding reference:", error);
      toast({
        title: "Error",
        description: "Failed to add reference",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addBulkReferences = async () => {
    if (!bulkUrls.trim()) return;

    const urls = parseReferencesFromText(bulkUrls);
    if (urls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "No valid URLs found in the text",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newReferences: ProjectReference[] = [];
      let duplicateCount = 0;

      for (const url of urls) {
        // Skip duplicates
        if (
          references.some((ref) => ref.url === url) ||
          newReferences.some((ref) => ref.url === url)
        ) {
          duplicateCount++;
          continue;
        }

        const newReference = createReference(url);

        // Try to fetch title
        try {
          const response = await fetch(
            `/api/metadata?url=${encodeURIComponent(url)}`
          );
          if (response.ok) {
            const metadata = await response.json();
            if (metadata.title) {
              newReference.title = metadata.title;
            }
          }
        } catch (error) {
          console.log(`Could not fetch metadata for ${url}`);
        }

        newReferences.push(newReference);
      }

      if (newReferences.length > 0) {
        const updatedReferences = [...references, ...newReferences];
        setReferences(updatedReferences);
        onReferencesUpdate?.(updatedReferences);

        let message = `Added ${newReferences.length} reference${newReferences.length === 1 ? "" : "s"}`;
        if (duplicateCount > 0) {
          message += `, skipped ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}`;
        }

        toast({
          title: "References Added",
          description: message,
          variant: "green",
        });
      } else if (duplicateCount > 0) {
        toast({
          title: "All Duplicates",
          description: "All URLs were already in your references",
          variant: "outline",
        });
      }

      setBulkUrls("");
      setShowBulkInput(false);
    } catch (error) {
      console.error("Error adding bulk references:", error);
      toast({
        title: "Error",
        description: "Failed to add references",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeReference = (id: string) => {
    const removedRef = references.find((ref) => ref.id === id);
    const updatedReferences = references.filter((ref) => ref.id !== id);
    setReferences(updatedReferences);
    onReferencesUpdate?.(updatedReferences);

    if (removedRef) {
      toast({
        title: "Reference Removed",
        description: `Removed: ${truncateText(removedRef.title || removedRef.url, 50)}`,
        variant: "green",
      });
    }
  };

  const startEditing = (reference: ProjectReference) => {
    setEditingReference({
      id: reference.id,
      url: reference.url,
      title: reference.title || "",
      customName: reference.customName || "",
    });
  };

  const cancelEditing = () => {
    setEditingReference(null);
  };

  const saveEditing = async () => {
    if (!editingReference) return;

    const normalizedUrl = normalizeReferenceUrl(editingReference.url);
    if (!isValidReferenceUrl(normalizedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Check for URL duplicates (excluding current reference)
    if (
      references.some(
        (ref) => ref.url === normalizedUrl && ref.id !== editingReference.id
      )
    ) {
      toast({
        title: "Duplicate URL",
        description: "This URL is already in your references",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let updatedTitle = editingReference.title;

      // If URL changed, try to fetch new title
      const originalReference = references.find(
        (ref) => ref.id === editingReference.id
      );
      if (originalReference?.url !== normalizedUrl) {
        try {
          const response = await fetch(
            `/api/metadata?url=${encodeURIComponent(normalizedUrl)}`
          );
          if (response.ok) {
            const metadata = await response.json();
            if (metadata.title) {
              updatedTitle = metadata.title;
            }
          }
        } catch (error) {
          console.log("Could not fetch metadata for updated URL");
        }
      }

      const updatedReferences = references.map((ref) =>
        ref.id === editingReference.id
          ? {
              ...ref,
              url: normalizedUrl,
              title: updatedTitle,
              customName: editingReference.customName.trim() || undefined,
            }
          : ref
      );

      setReferences(updatedReferences);
      onReferencesUpdate?.(updatedReferences);
      setEditingReference(null);

      toast({
        title: "Reference Updated",
        description: "Reference has been updated successfully",
        variant: "green",
      });
    } catch (error) {
      console.error("Error updating reference:", error);
      toast({
        title: "Error",
        description: "Failed to update reference",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Project References - {truncateText(projectName, 30)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Add References Section - Only show if not read-only */}
          {!readOnly && (
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-sm font-medium">Add New References</h3>

              {/* Single URL Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a URL (e.g., https://example.com)"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSingleReference();
                    }
                  }}
                />
                <Button
                  onClick={addSingleReference}
                  disabled={isLoading || !singleUrl.trim()}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Bulk Input Toggle */}
              {!showBulkInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkInput(true)}
                  disabled={isLoading}
                >
                  Add Multiple URLs
                </Button>
              )}

              {/* Bulk URL Input */}
              {showBulkInput && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste multiple URLs (one per line)&#10;https://example.com&#10;https://docs.google.com/..."
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    disabled={isLoading}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addBulkReferences}
                      disabled={isLoading || !bulkUrls.trim()}
                      size="sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        "Add URLs"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBulkInput(false);
                        setBulkUrls("");
                      }}
                      disabled={isLoading}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* References List */}
          {!references || references.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No References</h3>
              <p className="text-sm text-muted-foreground">
                {readOnly
                  ? "This project doesn't have any reference links yet."
                  : "Add reference links to documents, websites, or resources related to this project."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {references.length} reference
                {references.length === 1 ? "" : "s"} for this project
              </p>

              <div className="space-y-2">
                {references.map((reference) => (
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
                      <LinkIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}

                    {/* Content */}
                    {editingReference?.id === reference.id ? (
                      // Edit Mode
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingReference.url}
                          onChange={(e) =>
                            setEditingReference({
                              ...editingReference,
                              url: e.target.value,
                            })
                          }
                          placeholder="URL"
                          disabled={isLoading}
                        />
                        <Input
                          value={editingReference.customName}
                          onChange={(e) =>
                            setEditingReference({
                              ...editingReference,
                              customName: e.target.value,
                            })
                          }
                          placeholder="Custom name (optional)"
                          disabled={isLoading}
                        />
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-sm truncate"
                          title={reference.title || reference.url}
                        >
                          {truncateText(
                            reference.customName ||
                              reference.title ||
                              reference.url,
                            60
                          )}
                        </div>
                        {(reference.title || reference.customName) &&
                          reference.title !== reference.url && (
                            <div
                              className="text-xs text-muted-foreground truncate"
                              title={reference.url}
                            >
                              {truncateText(reference.url, 70)}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingReference?.id === reference.id ? (
                        // Edit Mode Actions
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={saveEditing}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 "
                            title="Save changes"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                            title="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        // View Mode Actions
                        <>
                          {" "}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUrl(reference.url)}
                            className="h-8 w-8 p-0"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyUrl(reference.url, reference.title)
                            }
                            className="h-8 w-8 p-0"
                            title="Copy URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!readOnly && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(reference)}
                                className="h-8 w-8 p-0"
                                title="Edit reference"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeReference(reference.id)}
                                className="h-8 w-8 p-0 "
                                title="Remove reference"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
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
