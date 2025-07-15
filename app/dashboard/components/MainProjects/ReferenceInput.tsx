// components/ReferenceInput.tsx (COMPLETE UPDATED FILE)
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Link2, Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  createReference,
  isValidReferenceUrl,
  normalizeReferenceUrl,
  parseReferencesFromText,
  ProjectReference,
} from "@/app/review/[token]/lib/reference-links";

interface ReferenceInputProps {
  references: ProjectReference[];
  onChange: (references: ProjectReference[]) => void;
  disabled?: boolean;
}

export function ReferenceInput({
  references,
  onChange,
  disabled = false,
}: ReferenceInputProps) {
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);

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
          if (metadata.error) {
            console.log(
              `Using fallback title for ${normalizedUrl}: ${metadata.error}`
            );
          }
        }
      } catch (error) {
        console.log("Could not fetch metadata, using URL as title");
      }

      onChange([...references, newReference]);
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
        onChange([...references, ...newReferences]);

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
    onChange(references.filter((ref) => ref.id !== id));

    if (removedRef) {
      toast({
        title: "Reference Removed",
        description: `Removed: ${truncateText(removedRef.title || removedRef.url, 50)}`,
        variant: "green",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="references">Reference Links (Optional)</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add URLs to documents, websites, or resources related to this project
        </p>
      </div>

      {/* Single URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter a URL (e.g., https://example.com)"
          value={singleUrl}
          onChange={(e) => setSingleUrl(e.target.value)}
          disabled={disabled || isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSingleReference();
            }
          }}
        />
        <Button
          type="button"
          onClick={addSingleReference}
          disabled={disabled || isLoading || !singleUrl.trim()}
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
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowBulkInput(true)}
          disabled={disabled}
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
            disabled={disabled || isLoading}
            rows={4}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addBulkReferences}
              disabled={disabled || isLoading || !bulkUrls.trim()}
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
              type="button"
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

      {/* Reference List */}
      {references.length > 0 && (
        <div className="space-y-2">
          <Label>Added References ({references.length})</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {references.map((reference) => (
              <ReferenceItem
                key={reference.id}
                reference={reference}
                onRemove={() => removeReference(reference.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReferenceItemProps {
  reference: ProjectReference;
  onRemove: () => void;
  disabled?: boolean;
}

function ReferenceItem({ reference, onRemove, disabled }: ReferenceItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
      {reference.favicon && (
        <img
          src={reference.favicon}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          title={reference.title || reference.url}
        >
          {truncateText(
            reference.title || reference.customName || reference.url,
            45
          )}
        </div>
        {reference.title && reference.title !== reference.url && (
          <div
            className="text-xs text-muted-foreground truncate"
            title={reference.url}
          >
            {truncateText(reference.url, 55)}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="h-6 w-6 p-0"
        title="Remove reference"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
