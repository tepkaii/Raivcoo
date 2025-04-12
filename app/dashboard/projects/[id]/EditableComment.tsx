// app/components/EditableComment.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkIcon, Edit, XCircle, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function detectAndExtractLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links: { url: string; text: string }[] = [];
  let processedText = text;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    links.push({
      url: match[0],
      text: match[0],
    });
    processedText = processedText.replace(
      match[0],
      `[LINK:${links.length - 1}]`
    );
  }

  return { processedText, links };
}

function replaceLinkPlaceholders(
  text: string,
  links: { url: string; text: string }[]
) {
  let result = text;
  links.forEach((link, index) => {
    result = result.replace(new RegExp(`\\[LINK:${index}\\]`, "g"), link.url);
  });
  return result;
}

interface EditableCommentProps {
  initialText: string;
  initialLinks: { url: string; text: string }[];
  initialImages?: string[];
  onSave: (text: string, links: { url: string; text: string }[]) => void;
  onImagesChange?: (images: File[]) => void;
  editable?: boolean;
}

export function EditableComment({
  initialText,
  initialLinks,
  initialImages = [],
  onSave,
  onImagesChange,
  editable = false,
}: EditableCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    replaceLinkPlaceholders(initialText, initialLinks)
  );
  const [links, setLinks] = useState(initialLinks);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const handleSave = () => {
    const { processedText, links: detectedLinks } = detectAndExtractLinks(text);
    const allLinks = [...links, ...detectedLinks];
    onSave(processedText, allLinks);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
      if (onImagesChange) {
        onImagesChange([...images, ...newImages]);
      }
    }
  };

  const displayText = replaceLinkPlaceholders(initialText, initialLinks);

  return (
    <div className="space-y-3">
      {isEditing ? (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLinkDialogOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Manage Links
            </Button>

            <Label
              htmlFor="comment-images"
              className="flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Add Images
              <Input
                id="comment-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </Label>
          </div>

          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Links</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {links.map((link, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1 grid gap-2">
                      <Input
                        type="url"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...links];
                          newLinks[index].url = e.target.value;
                          setLinks(newLinks);
                        }}
                      />
                      <Input
                        placeholder="Link text"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...links];
                          newLinks[index].text = e.target.value;
                          setLinks(newLinks);
                        }}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const newLinks = [...links];
                        newLinks.splice(index, 1);
                        setLinks(newLinks);
                      }}
                      className="mt-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLinks([...links, { url: "", text: "" }])}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsLinkDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </>
      ) : (
        <div className="relative">
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <p className="whitespace-pre-line">{displayText}</p>
          {links.length > 0 && (
            <div className="mt-2 space-y-1">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline break-all"
                  >
                    {link.text}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
