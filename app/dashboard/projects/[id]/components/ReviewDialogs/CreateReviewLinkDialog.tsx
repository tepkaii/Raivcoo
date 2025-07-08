// app/dashboard/projects/[id]/components/reviews_Dialogs/CreateReviewLinkDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Copy,
  ExternalLink,
  Link,
  Check,
  Loader2,
  Download,
  Crown,
  Lock,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
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
import { getSubscriptionInfo } from "@/app/dashboard/lib/actions";
import { createClient } from "@/utils/supabase/client";

interface CreateLinkDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  isCreating: boolean;
  showSuccess: boolean;
  createdUrl?: string;
}

interface ReviewLinkPermissions {
  canSetExpiration: boolean;
  canSetPassword: boolean;
  canDisableDownload: boolean;
  planName: string;
  isActive: boolean;
  suggestions: {
    expiration?: string;
    password?: string;
    download?: string;
  };
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
      allowDownload: boolean;
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
    allowDownload: true,
  });

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState({
    hours: "23",
    minutes: "59",
  });
  const [permissions, setPermissions] = useState<ReviewLinkPermissions | null>(
    null
  );
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Load permissions when dialog opens
  useEffect(() => {
    if (createLinkDialog.open && !createLinkDialog.showSuccess) {
      loadPermissions();
    }
  }, [createLinkDialog.open, createLinkDialog.showSuccess]);

  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const subscriptionInfo = await getSubscriptionInfo(user.id);

      const hasActiveSubscription =
        subscriptionInfo.hasPaidPlan &&
        subscriptionInfo.isActive &&
        !subscriptionInfo.isExpired;

      let perms: ReviewLinkPermissions;

      if (hasActiveSubscription) {
        perms = {
          canSetExpiration: true,
          canSetPassword: true,
          canDisableDownload: true,
          planName: subscriptionInfo.planName,
          isActive: true,
          suggestions: {},
        };
      } else {
        perms = {
          canSetExpiration: false,
          canSetPassword: false,
          canDisableDownload: false,
          planName: subscriptionInfo.planName,
          isActive: false,
          suggestions: {
            expiration: "Upgrade to Lite or Pro to set custom expiration dates",
            password: "Upgrade to Lite or Pro to protect links with passwords",
            download: "Upgrade to Lite or Pro to control download permissions",
          },
        };
      }

      setPermissions(perms);

      setLinkFormData((prev) => ({
        ...prev,
        requiresPassword: false,
        password: "",
        allowDownload: true,
        expiresAt: "",
      }));
      setSelectedDate(undefined);
    } catch (error) {
      console.error("Failed to load permissions:", error);

      setPermissions({
        canSetExpiration: false,
        canSetPassword: false,
        canDisableDownload: false,
        planName: "Free",
        isActive: false,
        suggestions: {
          expiration:
            "Could not verify subscription. Expiration dates require Lite or Pro plan.",
          password:
            "Could not verify subscription. Password protection requires Lite or Pro plan.",
          download:
            "Could not verify subscription. Download control requires Lite or Pro plan.",
        },
      });

      toast({
        title: "Warning",
        description:
          "Could not load feature permissions. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleDateChange = (date?: Date) => {
    if (!permissions?.canSetExpiration) {
      toast({
        title: "Feature Not Available",
        description:
          permissions?.suggestions.expiration ||
          "Upgrade to set expiration dates",
        variant: "destructive",
      });
      return;
    }

    setSelectedDate(date);
    updateExpirationTime(date, selectedTime);
  };

  const handleTimeChange = (field: "hours" | "minutes", value: string) => {
    if (!permissions?.canSetExpiration) return;

    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    updateExpirationTime(selectedDate, newTime);
  };

  const updateExpirationTime = (
    date?: Date,
    time?: { hours: string; minutes: string }
  ) => {
    if (date && time && permissions?.canSetExpiration) {
      const expirationDate = new Date(date);
      expirationDate.setHours(
        parseInt(time.hours),
        parseInt(time.minutes),
        59,
        999
      );
      setLinkFormData((prev) => ({
        ...prev,
        expiresAt: expirationDate.toISOString(),
      }));
    } else {
      setLinkFormData((prev) => ({ ...prev, expiresAt: "" }));
    }
  };

  const handlePasswordToggle = (checked: boolean) => {
    if (!permissions?.canSetPassword && checked) {
      toast({
        title: "Feature Not Available",
        description:
          permissions?.suggestions.password || "Upgrade to set passwords",
        variant: "destructive",
      });
      return;
    }

    setLinkFormData((prev) => ({
      ...prev,
      requiresPassword: checked,
      password: checked ? prev.password : "",
    }));
  };

  const handleDownloadToggle = (checked: boolean) => {
    if (!permissions?.canDisableDownload && !checked) {
      toast({
        title: "Feature Not Available",
        description:
          permissions?.suggestions.download || "Upgrade to disable downloads",
        variant: "destructive",
      });
      return;
    }

    setLinkFormData((prev) => ({
      ...prev,
      allowDownload: checked,
    }));
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
      setPermissions(null);
      setIsLoadingPermissions(true);
    }
    onCreateLinkDialogChange({
      open,
      isCreating: false,
      showSuccess: false,
    });
  };

  // Show loading state while permissions are being fetched
  if (
    createLinkDialog.open &&
    isLoadingPermissions &&
    !createLinkDialog.showSuccess
  ) {
    return (
      <Dialog open={createLinkDialog.open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Review Link</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading features...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={createLinkDialog.open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {createLinkDialog.showSuccess
              ? "Review Link Created!"
              : "Create Review Link"}
            {permissions && (
              <Badge
                variant={permissions.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {permissions.planName}
              </Badge>
            )}
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
                    const linkToken = createLinkDialog.createdUrl
                      ?.split("/")
                      .pop();
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
              <Button onClick={() => handleDialogClose(false)}>Done</Button>
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
                  allowDownload: linkFormData.allowDownload,
                });
              }
            }}
            className="space-y-4"
          >
            {/* Basic Title Field - Always Available */}
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

            {/* Expiration Date & Time - Lite/Pro Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    !permissions?.canSetExpiration && "text-muted-foreground"
                  )}
                >
                  Expiration Date & Time
                  {!permissions?.canSetExpiration && (
                    <Crown className="h-4 w-4 text-orange-500" />
                  )}
                </Label>
                {!permissions?.canSetExpiration && (
                  <Badge variant="outline" className="text-xs">
                    Lite/Pro
                  </Badge>
                )}
              </div>

              {permissions?.canSetExpiration ? (
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
                          onChange={(e) =>
                            handleTimeChange("hours", e.target.value)
                          }
                          className="w-16 text-center"
                          placeholder="00"
                        />
                        <span>:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={selectedTime.minutes}
                          onChange={(e) =>
                            handleTimeChange("minutes", e.target.value)
                          }
                          className="w-16 text-center"
                          placeholder="00"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Leave blank for permanent link. Link will expire at the
                    specified date and time.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upgrade to Lite or Pro to set custom expiration dates for your
                  review links.
                </p>
              )}
            </div>

            {/* Download Settings - Lite/Pro Can Disable */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Download Settings
                  {!permissions?.canDisableDownload && (
                    <Crown className="h-4 w-4 text-orange-500" />
                  )}
                </Label>
                {!permissions?.canDisableDownload && (
                  <Badge variant="outline" className="text-xs">
                    Lite/Pro
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="allowDownload" className="text-sm">
                      Allow file downloads
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permissions?.canDisableDownload
                        ? "Reviewers can download the original media file"
                        : "Downloads always enabled on Free plan"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="allowDownload"
                  checked={linkFormData.allowDownload}
                  onCheckedChange={handleDownloadToggle}
                  disabled={!permissions?.canDisableDownload}
                />
              </div>
            </div>

            {/* Password Protection - Lite/Pro Only */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Access Settings
                  {!permissions?.canSetPassword && (
                    <Crown className="h-4 w-4 text-orange-500" />
                  )}
                </Label>
                {!permissions?.canSetPassword && (
                  <Badge variant="outline" className="text-xs">
                    Lite/Pro
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LockClosedIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="requiresPassword" className="text-sm">
                      Require password to access
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permissions?.canSetPassword
                        ? "Protect this review link with a password"
                        : "Password protection requires Lite or Pro plan"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="requiresPassword"
                  checked={linkFormData.requiresPassword}
                  onCheckedChange={handlePasswordToggle}
                  disabled={!permissions?.canSetPassword}
                />
              </div>

              {linkFormData.requiresPassword && permissions?.canSetPassword && (
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
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
              >
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