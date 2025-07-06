// app/settings/notifications/components/NotificationSettings.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { toast } from "@/hooks/use-toast";
import { updateNotificationPreferences } from "../actions/NotificationsActions";
import { Loader2 } from "lucide-react";

interface NotificationSettingsProps {
  initialPreferences: any;
}

const DEFAULT_PREFERENCES = {
  comments: {
    all_comments: { enabled: true, delivery: "both" },
    replies_to_me: { enabled: true, delivery: "both" },
  },
  media: {
    my_uploads: { enabled: false, delivery: "activity" },
    others_uploads: { enabled: true, delivery: "both" },
    my_deletes: { enabled: false, delivery: "activity" },
    others_deletes: { enabled: true, delivery: "both" },
  },
  status_changes: {
    enabled: true,
    levels: ["approved", "rejected"],
    delivery: "both",
  },
};

export function NotificationSettings({
  initialPreferences,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState(
    Object.keys(initialPreferences).length > 0
      ? initialPreferences
      : DEFAULT_PREFERENCES
  );
  const [isPending, startTransition] = useTransition();

  const updatePreference = (path: string[], value: any) => {
    setPreferences((prev: any) => {
      const newPrefs = { ...prev };
      let current = newPrefs;

      // Navigate to the correct nested object
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      // Set the final value
      current[path[path.length - 1]] = value;

      return newPrefs;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateNotificationPreferences(preferences);

        if (result.success) {
          toast({
            title: "Settings Updated",
            description: "Your notification preferences have been saved.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update preferences",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>
            Manage notifications for comments and replies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>All Comments</Label>
              <p className="text-sm text-muted-foreground">
                When someone comments on project media
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.comments?.all_comments?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(
                    ["comments", "all_comments", "enabled"],
                    checked
                  )
                }
              />
              {preferences.comments?.all_comments?.enabled && (
                <Select
                  value={preferences.comments?.all_comments?.delivery || "both"}
                  onValueChange={(value) =>
                    updatePreference(
                      ["comments", "all_comments", "delivery"],
                      value
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Replies to Me</Label>
              <p className="text-sm text-muted-foreground">
                When someone replies to your comments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.comments?.replies_to_me?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(
                    ["comments", "replies_to_me", "enabled"],
                    checked
                  )
                }
              />
              {preferences.comments?.replies_to_me?.enabled && (
                <Select
                  value={
                    preferences.comments?.replies_to_me?.delivery || "both"
                  }
                  onValueChange={(value) =>
                    updatePreference(
                      ["comments", "replies_to_me", "delivery"],
                      value
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Section */}
      <Card>
        <CardHeader>
          <CardTitle>Media Activities</CardTitle>
          <CardDescription>
            Manage notifications for media uploads and deletions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>My Uploads</Label>
              <p className="text-sm text-muted-foreground">
                When you upload media
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.media?.my_uploads?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(["media", "my_uploads", "enabled"], checked)
                }
              />
              {preferences.media?.my_uploads?.enabled && (
                <Select
                  value={preferences.media?.my_uploads?.delivery || "activity"}
                  onValueChange={(value) =>
                    updatePreference(["media", "my_uploads", "delivery"], value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Others' Uploads</Label>
              <p className="text-sm text-muted-foreground">
                When team members upload media
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.media?.others_uploads?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(
                    ["media", "others_uploads", "enabled"],
                    checked
                  )
                }
              />
              {preferences.media?.others_uploads?.enabled && (
                <Select
                  value={preferences.media?.others_uploads?.delivery || "both"}
                  onValueChange={(value) =>
                    updatePreference(
                      ["media", "others_uploads", "delivery"],
                      value
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>My Deletes</Label>
              <p className="text-sm text-muted-foreground">
                When you delete media
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.media?.my_deletes?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(["media", "my_deletes", "enabled"], checked)
                }
              />
              {preferences.media?.my_deletes?.enabled && (
                <Select
                  value={preferences.media?.my_deletes?.delivery || "activity"}
                  onValueChange={(value) =>
                    updatePreference(["media", "my_deletes", "delivery"], value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Others' Deletes</Label>
              <p className="text-sm text-muted-foreground">
                When team members delete media
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.media?.others_deletes?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(
                    ["media", "others_deletes", "enabled"],
                    checked
                  )
                }
              />
              {preferences.media?.others_deletes?.enabled && (
                <Select
                  value={preferences.media?.others_deletes?.delivery || "both"}
                  onValueChange={(value) =>
                    updatePreference(
                      ["media", "others_deletes", "delivery"],
                      value
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Changes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Status Changes</CardTitle>
          <CardDescription>
            Manage notifications for media status updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Status Changes</Label>
              <p className="text-sm text-muted-foreground">
                When media status changes (approved, rejected, etc.)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.status_changes?.enabled || false}
                onCheckedChange={(checked) =>
                  updatePreference(["status_changes", "enabled"], checked)
                }
              />
              {preferences.status_changes?.enabled && (
                <Select
                  value={preferences.status_changes?.delivery || "both"}
                  onValueChange={(value) =>
                    updatePreference(["status_changes", "delivery"], value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {preferences.status_changes?.enabled && (
            <div className="space-y-2">
              <Label>Notify me for these status changes:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "needs_review", label: "Needs Review" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "on_hold", label: "On Hold" },
                ].map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center space-x-2"
                  >
                    <Switch
                      id={status.value}
                      checked={
                        preferences.status_changes?.levels?.includes(
                          status.value
                        ) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentLevels =
                          preferences.status_changes?.levels || [];
                        const newLevels = checked
                          ? [...currentLevels, status.value]
                          : currentLevels.filter(
                              (l: string) => l !== status.value
                            );
                        updatePreference(
                          ["status_changes", "levels"],
                          newLevels
                        );
                      }}
                    />
                    <Label htmlFor={status.value} className="text-sm">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
