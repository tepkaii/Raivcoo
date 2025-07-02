// app/dashboard/projects/[id]/components/reviews_Dialogs/CreateReviewLinkDialog.tsx
"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Copy,
  ExternalLink,
  Link,
  Check,
  Loader2,
  Download,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { MediaFile } from "@/app/dashboard/lib/types";
import { LockClosedIcon } from "@heroicons/react/24/solid";

interface CreateLinkDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  isCreating: boolean;
  showSuccess: boolean;
  createdUrl?: string;
}

interface CreateReviewLinkDialogProps {
  createLinkDialog: CreateLinkDialogState;
  onCreateLinkDialogChange: (dialog: CreateLinkDialogState) => void;
  onCreateReviewLink: (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
      allowDownload: boolean; // ✅ NEW OPTION
    }
  ) => void;
}

export function CreateReviewLinkDialog({
  createLinkDialog,
  onCreateLinkDialogChange,
  onCreateReviewLink,
}: CreateReviewLinkDialogProps) {
  const [linkFormData, setLinkFormData] = useState({
    title: "",
    expiresAt: "",
    requiresPassword: false,
    password: "",
    allowDownload: true, // ✅ NEW FIELD - Default to true
  });

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState({ hours: "23", minutes: "59" });

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date);
    updateExpirationTime(date, selectedTime);
  };

  const handleTimeChange = (field: "hours" | "minutes", value: string) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    updateExpirationTime(selectedDate, newTime);
  };

  const updateExpirationTime = (date?: Date, time?: { hours: string; minutes: string }) => {
    if (date && time) {
      const expirationDate = new Date(date);
      expirationDate.setHours(parseInt(time.hours), parseInt(time.minutes), 59, 999);
      setLinkFormData((prev) => ({ ...prev, expiresAt: expirationDate.toISOString() }));
    } else {
      setLinkFormData((prev) => ({ ...prev, expiresAt: "" }));
    }
  };

  const handleCopyReviewLink = async (linkToken: string) => {
    const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/review/${linkToken}`;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      toast({
        title: "Link Copied",
        description: "Review link copied to clipboard",
        variant: "green",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // ✅ Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setLinkFormData({
        title: "",
        expiresAt: "",
        requiresPassword: false,
        password: "",
        allowDownload: true,
      });
      setSelectedDate(undefined);
      setSelectedTime({ hours: "23", minutes: "59" });
    }
    onCreateLinkDialogChange({
      open,
      isCreating: false,
      showSuccess: false,
    });
  };

  return (
    <Dialog open={createLinkDialog.open} onOpenChange={handleDialogClose}>
      <DialogContent className=" max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createLinkDialog.showSuccess
              ? "Review Link Created!"
              : "Create Review Link"}
          </DialogTitle>
        </DialogHeader>

        {createLinkDialog.showSuccess ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-700 p-2 rounded-[10px] border-2 border-black/20">
                  <Check className="h-5 w-5 text-green-200" />
                </div>
                <div>
                  <p className="font-medium">Link created successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    The link has been copied to your clipboard
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Review Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={
                    createLinkDialog.createdUrl
                      ? `${process.env.NEXT_PUBLIC_BASE_URL}/review/${createLinkDialog.createdUrl
                          .split("/")
                          .pop()}`
                      : ""
                  }
                  readOnly
                
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleCopyReviewLink(
                      createLinkDialog.createdUrl?.split("/").pop() || ""
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const linkToken = createLinkDialog.createdUrl?.split("/").pop();
                    if (linkToken) {
                      window.open(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/review/${linkToken}`,
                        "_blank"
                      );
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleDialogClose(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (createLinkDialog.mediaFile) {
                onCreateReviewLink(createLinkDialog.mediaFile, {
                  title: linkFormData.title,
                  expiresAt: linkFormData.expiresAt || undefined,
                  requiresPassword: linkFormData.requiresPassword,
                  password: linkFormData.password || undefined,
                  allowDownload: linkFormData.allowDownload, // ✅ PASS NEW OPTION
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Review Title (Optional)</Label>
              <Input
                className="mt-1"
                id="title"
                value={linkFormData.title}
                onChange={(e) =>
                  setLinkFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter a title for this review"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiration Date & Time (Optional)</Label>
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    {selectedDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => handleDateChange(undefined)}
                          className="w-full"
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {selectedDate && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Time:</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={selectedTime.hours}
                        onChange={(e) => handleTimeChange("hours", e.target.value)}
                        className="w-16 text-center"
                        placeholder="00"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={selectedTime.minutes}
                        onChange={(e) => handleTimeChange("minutes", e.target.value)}
                        className="w-16 text-center"
                        placeholder="00"
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank for permanent link. Link will expire at the specified date and time.
              </p>
            </div>

            {/* ✅ NEW DOWNLOAD PERMISSION SECTION */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Download Settings</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="allowDownload" className="text-sm">
                      Allow file downloads
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reviewers can download the original media file
                    </p>
                  </div>
                </div>
                <Switch
                  id="allowDownload"
                  checked={linkFormData.allowDownload}
                  onCheckedChange={(checked) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      allowDownload: checked,
                    }))
                  }
                />
              </div>
            </div>

           {/* Updated Password Section - Same format as Download Settings */}
<div className="space-y-3 border-t pt-4">
  <Label className="text-sm font-medium">Access Settings</Label>
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <LockClosedIcon className="h-4 w-4 text-muted-foreground" />
      <div>
        <Label htmlFor="requiresPassword" className="text-sm">
          Require password to access
        </Label>
        <p className="text-xs text-muted-foreground">
          Protect this review link with a password
        </p>
      </div>
    </div>
    <Switch
      id="requiresPassword"
      checked={linkFormData.requiresPassword}
      onCheckedChange={(checked) =>
        setLinkFormData((prev) => ({
          ...prev,
          requiresPassword: checked,
        }))
      }
    />
  </div>
</div>
            {linkFormData.requiresPassword && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  className="mt-2"
                  id="password"
                  type="password"
                  value={linkFormData.password}
                  onChange={(e) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  required={linkFormData.requiresPassword}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLinkDialog.isCreating}>
                {createLinkDialog.isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Create & Copy Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}