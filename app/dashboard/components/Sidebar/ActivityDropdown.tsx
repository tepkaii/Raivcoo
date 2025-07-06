// app/dashboard/components/Sidebar/ActivityDropdown.tsx
// @ts-nocheck
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getActivityNotifications,
  getUnreadActivityCount,
  markAllActivitiesAsRead,
  markActivityAsRead,
  deleteActivity,
  deleteAllActivities,
} from "@/app/dashboard/components/Sidebar/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Loader2,
  MessageCircle, // Using Lucide icon for consistency
  Trash2, // Using Lucide icon for consistency
  Upload,
  UserMinus,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  ChatBubbleOvalLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define the type for a single activity notification
interface ActivityNotification {
  id: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
  activity_data: { type?: string };
}

// Helper to get a corresponding icon for an activity type
const getActivityIcon = (activityType?: string) => {
  switch (activityType) {
    case "comment_added":
    case "comment_reply":
      return <ChatBubbleOvalLeftIcon className="h-4 w-4" />;

    // FIX 1: Changed "media_uploaded" to "media_upload" to match your data
    case "media_upload":
      return <Upload className="h-4 w-4" />;

    // FIX 2: Changed "media_deleted" to "media_delete" to match your data
    case "media_delete":
      return <TrashIcon className="h-4 w-4" />;

    case "media_status_change":
      return <AlertCircle className="h-4 w-4" />;
    case "team_member_added":
    case "invitation_received":
    case "invitation_accepted":
      return <UserPlusIcon className="h-4 w-4" />;
    case "invitation_declined":
    case "team_member_removed":
      return <UserMinusIcon className="h-4 w-4" />;
    case "project_created":
      return <FileText className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

// Helper to get a corresponding color for an activity type
const getActivityColor = (activityType?: string) => {
  switch (activityType) {
    case "comment_added":
    case "comment_reply":
      return "text-blue-500";

    // FIX 3: Added matching "media_upload" case for color
    case "media_upload":
    case "invitation_accepted":
      return "text-green-500";

    // FIX 4: Added matching "media_delete" case for color
    case "media_delete":
    case "invitation_declined":
      return "text-red-500";

    case "media_status_change":
      return "text-yellow-500";
    case "team_member_added":
    case "invitation_received":
      return "text-purple-500";
    case "team_member_removed":
      return "text-orange-500";
    case "project_created":
      return "text-indigo-500";
    default:
      return "text-gray-500";
  }
};

export function ActivityDropdown() {
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial unread count on component mount
  useEffect(() => {
    const fetchInitialCount = async () => {
      const result = await getUnreadActivityCount();
      if (result.success) {
        setUnreadCount(result.count);
      }
    };
    fetchInitialCount();
  }, []);

  // Fetch detailed activities when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      startTransition(async () => {
        const result = await getActivityNotifications(20); // Fetch latest 20
        if (result.success && result.activities) {
          setActivities(result.activities);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch notifications.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleMarkOneAsRead = (activityId: string) => {
    startTransition(async () => {
      const activity = activities.find((a) => a.id === activityId);
      if (activity && !activity.is_read) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, is_read: true } : a))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      await markActivityAsRead(activityId);
    });
  };

  const handleDelete = (activityId: string) => {
    startTransition(async () => {
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      const result = await deleteActivity(activityId);
      if (result.success) {
        toast({ title: "Notification deleted", variant: "default" });
        const countResult = await getUnreadActivityCount();
        if (countResult.success) setUnreadCount(countResult.count);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete notification.",
          variant: "destructive",
        });
        const activitiesResult = await getActivityNotifications(20);
        if (activitiesResult.success)
          setActivities(activitiesResult.activities || []);
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllActivitiesAsRead();
      if (result.success) {
        setActivities((prev) => prev.map((a) => ({ ...a, is_read: true })));
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };
  const handleDeleteAll = () => {
    startTransition(async () => {
      const result = await deleteAllActivities();
      if (result.success) {
        setActivities([]); // Clear activities from the UI
        setUnreadCount(0); // Reset unread count
        toast({
          title: "Success",
          description: "All notifications have been cleared.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };
  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="flex items-center w-full group-data-[collapsible=icon]:justify-center relative">
          <div>
            <BellIcon strokeWidth={1.5} className="size-6" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Badge className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0">
              {unreadCount}
            </Badge>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 mr-4" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Recent Activity</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs h-auto px-2 py-1"
              >
                {isPending && activities.every((a) => !a.is_read) ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Mark all as read
              </Button>
            )}
            {/* 4. Add the "Clear All" button with confirmation */}
            {activities.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/80 hover:text-destructive"
                    disabled={isPending}
                    aria-label="Clear all notifications"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all of your
                      notifications and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <DropdownMenuItem
                key={activity.id}
                onSelect={(e) => e.preventDefault()}
                className={cn(
                  "flex items-start p-2.5 transition-colors data-[highlighted]:bg-accent/50",
                  !activity.is_read && "bg-primary/5"
                )}
              >
                <div className="flex gap-3 items-start w-full">
                  {/* Colored Icon */}
                  <div
                    className={cn(
                      "p-2 mt-1 rounded-[5px] bg-muted ",
                      getActivityColor(activity.activity_data?.type)
                    )}
                  >
                    {getActivityIcon(activity.activity_data?.type)}
                  </div>
                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 min-w-0",
                      // BEST PRACTICE: When an activity is read, just lower the opacity.
                      activity.is_read && "opacity-60"
                    )}
                  >
                    <p className="text-sm font-medium leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-normal">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1.5">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!activity.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMarkOneAsRead(activity.id)}
                        aria-label="Mark as read"
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(activity.id)}
                      aria-label="Delete"
                      disabled={isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <BellIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm font-medium">No new notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
