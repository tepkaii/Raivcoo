// app/activity/components/ActivityFeed.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  markActivityAsRead,
  markAllActivitiesAsRead,
  deleteActivity,
} from "./actions";
import { toast } from "@/hooks/use-toast";
import {
  Check,
  CheckCheck,
  Trash2,
  Clock,
  MessageCircle,
  Upload,
  Download,
  UserPlus,
  UserMinus,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityNotification {
  id: string;
  title: string;
  description: string;
  activity_data: any;
  actor_name: string;
  is_read: boolean;
  created_at: string;
  project_id: string;
  projects?: {
    id: string;
    name: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityNotification[];
  unreadCount: number;
}

export function ActivityFeed({ activities, unreadCount }: ActivityFeedProps) {
  const [isPending, startTransition] = useTransition();
  const [localActivities, setLocalActivities] = useState(activities);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "comment_added":
      case "comment_reply":
        return <MessageCircle className="h-4 w-4" />;
      case "media_uploaded":
        return <Upload className="h-4 w-4" />;
      case "media_deleted":
        return <Trash2 className="h-4 w-4" />;
      case "media_status_change":
        return <AlertCircle className="h-4 w-4" />;
      case "team_member_added":
        return <UserPlus className="h-4 w-4" />;
      case "invitation_received":
        return <UserPlus className="h-4 w-4" />;
      case "invitation_accepted":
        return <CheckCheck className="h-4 w-4" />;
      case "invitation_declined":
        return <UserMinus className="h-4 w-4" />;
      case "team_member_removed":
        return <UserMinus className="h-4 w-4" />;
      case "project_created":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "comment_added":
      case "comment_reply":
        return "text-blue-500";
      case "media_uploaded":
        return "text-green-500";
      case "media_deleted":
        return "text-red-500";
      case "media_status_change":
        return "text-yellow-500";
      case "team_member_added":
        return "text-purple-500";
      case "team_member_removed":
        return "text-orange-500";
      case "project_created":
        return "text-indigo-500";
      case "invitation_received":
        return "text-blue-500";
      case "invitation_accepted":
        return "text-green-500";
      case "invitation_declined":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleMarkAsRead = (activityId: string) => {
    startTransition(async () => {
      try {
        const result = await markActivityAsRead(activityId);

        if (result.success) {
          setLocalActivities((prev) =>
            prev.map((activity) =>
              activity.id === activityId
                ? { ...activity, is_read: true }
                : activity
            )
          );
          toast({
            title: "Marked as read",
            description: "Activity has been marked as read",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to mark as read",
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

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        const result = await markAllActivitiesAsRead();

        if (result.success) {
          setLocalActivities((prev) =>
            prev.map((activity) => ({ ...activity, is_read: true }))
          );
          toast({
            title: "All marked as read",
            description: "All activities have been marked as read",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to mark all as read",
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

  const handleDelete = (activityId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteActivity(activityId);

        if (result.success) {
          setLocalActivities((prev) =>
            prev.filter((activity) => activity.id !== activityId)
          );
          toast({
            title: "Activity deleted",
            description: "Activity has been removed",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete activity",
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

  const unreadActivities = localActivities.filter((a) => !a.is_read);

  if (localActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No activities yet</h3>
        <p className="text-muted-foreground">
          Your project activities will appear here when things happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            {unreadActivities.length} unread activities
          </p>
        </div>

        {unreadActivities.length > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {localActivities.map((activity) => (
          <Card
            key={activity.id}
            className={`transition-all ${
              activity.is_read
                ? "bg-background opacity-75"
                : "bg-primary-foreground border-l-4 border-l-blue-500"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Activity Icon */}
                  <div
                    className={`p-2 rounded-lg bg-muted ${getActivityColor(activity.activity_data?.type || "default")}`}
                  >
                    {getActivityIcon(activity.activity_data?.type || "default")}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      {!activity.is_read && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{activity.actor_name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {activity.projects && (
                        <>
                          <span>•</span>
                          <span>{activity.projects.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {!activity.is_read && (
                    <Button
                      onClick={() => handleMarkAsRead(activity.id)}
                      disabled={isPending}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    onClick={() => handleDelete(activity.id)}
                    disabled={isPending}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button (if needed) */}
      {localActivities.length >= 50 && (
        <div className="text-center py-4">
          <Button variant="outline">Load More Activities</Button>
        </div>
      )}
    </div>
  );
}
