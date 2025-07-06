// app/dashboard/settings/Tabs/UsageTab.tsx
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  FolderIcon,
  ServerIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { formatStatus, formatDate, formatNumber } from "../../lib/formats";
interface UsageTabProps {
  user: any;
}

interface UsageStats {
  projectsUsed: number;
  projectsLimit: number;
  storageUsed: number; // in GB
  storageLimit: number; // in GB
  maxMembersInProject: number; // Maximum members in any single project
  membersLimit: number; // Limit per project
  projectsWithMemberLimits: Array<{
    projectId: string;
    projectName: string;
    memberCount: number;
  }>;
}

interface PlanInfo {
  isFreePlan: boolean;
  isProPlan: boolean;
  isActivePlan: boolean;
  isWithinBillingPeriod: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  planDisplayName: string;
  daysUntilExpiry: number;
}

export default function UsageTab({ user }: UsageTabProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    projectsUsed: 0,
    projectsLimit: 0,
    storageUsed: 0,
    storageLimit: 0,
    maxMembersInProject: 0,
    membersLimit: 0,
    projectsWithMemberLimits: [],
  });
  const [isUsageLoading, setIsUsageLoading] = useState(true);

  const supabase = createClient();

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user?.id) return;

    try {
      setIsSubscriptionLoading(true);
      const { data: subscriptionData, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
      } else {
        console.log("Fetched subscription in client:", subscriptionData);
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error("Error in fetchSubscription:", error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  // Comprehensive plan detection with edge case handling
  const getPlanInfo = (): PlanInfo => {
    console.log("getPlanInfo called with subscription:", subscription);

    // Handle no subscription case
    if (!subscription) {
      console.log("No subscription found - defaulting to Free plan");
      return {
        isFreePlan: true,
        isProPlan: false,
        isActivePlan: false,
        isWithinBillingPeriod: false,
        isCancelled: false,
        isExpired: false,
        planDisplayName: "Free Plan",
        daysUntilExpiry: 0,
      };
    }

    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    console.log("Date calculations:", {
      now: now.toISOString(),
      periodEnd: periodEnd?.toISOString(),
      subscription_status: subscription.status,
      plan_id: subscription.plan_id,
      plan_name: subscription.plan_name,
    });

    const isWithinBillingPeriod = periodEnd && now < periodEnd;
    const daysUntilExpiry = periodEnd
      ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Check subscription status
    const validStatuses = ["active", "trialing", "past_due"];
    const isActiveStatus = validStatuses.includes(
      subscription.status?.toLowerCase()
    );
    const isCancelled = subscription.status?.toLowerCase() === "cancelled";
    const isExpired =
      subscription.status?.toLowerCase() === "expired" ||
      (periodEnd && now >= periodEnd);

    console.log("Status checks:", {
      isActiveStatus,
      isCancelled,
      isExpired,
      isWithinBillingPeriod,
      daysUntilExpiry,
    });

    // Plan is considered active if:
    // 1. Status is active/trialing/past_due, OR
    // 2. Status is cancelled but still within billing period
    const isActivePlan =
      isActiveStatus || (isCancelled && isWithinBillingPeriod);

    // Determine plan type
    const planId = subscription.plan_id?.toLowerCase();
    const planName = subscription.plan_name?.toLowerCase();

    const isProPlan =
      isActivePlan &&
      (planId === "pro" ||
        planName === "pro" ||
        planId === "premium" ||
        planName === "premium");

    const isFreePlan =
      !isActivePlan || planId === "free" || planName === "free" || isExpired;

    console.log("Plan determination:", {
      planId,
      planName,
      isActivePlan,
      isProPlan,
      isFreePlan,
    });

    // Generate display name
    let planDisplayName = "Free Plan";
    if (isProPlan) {
      planDisplayName = subscription.plan_name || "Pro Plan";
      if (isCancelled) {
        planDisplayName += " (Cancelled)";
      }
    } else if (subscription.plan_name && !isFreePlan) {
      planDisplayName = subscription.plan_name;
      if (isCancelled) planDisplayName += " (Cancelled)";
      if (isExpired) planDisplayName += " (Expired)";
    }

    const result = {
      isFreePlan,
      isProPlan,
      isActivePlan,
      isWithinBillingPeriod: isWithinBillingPeriod || false,
      isCancelled,
      isExpired,
      planDisplayName,
      daysUntilExpiry: Math.max(daysUntilExpiry, 0),
    };

    console.log("Final plan info:", result);
    return result;
  };

  const fetchUsageStats = async () => {
    if (!user?.id) return;

    try {
      setIsUsageLoading(true);

      // Get user's profile to find their editor_id
      const { data: profile, error: profileError } = await supabase
        .from("editor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        throw new Error("User profile not found");
      }

      // Fetch projects count and details
      const {
        data: projects,
        count: projectsCount,
        error: projectsError,
      } = await supabase
        .from("projects")
        .select("id, name", { count: "exact" })
        .eq("editor_id", profile.id);

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
      }

      // Fetch storage usage by summing file sizes from project_media
      const { data: mediaFiles, error: mediaError } = await supabase
        .from("project_media")
        .select(
          `
          file_size,
          project_id,
          projects!inner(editor_id)
        `
        )
        .eq("projects.editor_id", profile.id);

      if (mediaError) {
        console.error("Error fetching media files:", mediaError);
      }

      // Calculate total storage used in GB
      const totalStorageBytes =
        mediaFiles?.reduce((total, file) => total + (file.file_size || 0), 0) ||
        0;
      const storageUsedGB = totalStorageBytes / (1024 * 1024 * 1024); // Convert bytes to GB

      // Fetch members per project
      const projectsWithMembers = [];
      let maxMembersInProject = 0;

      if (projects && projects.length > 0) {
        // Use Promise.all for better performance
        const memberPromises = projects.map(async (project) => {
          const { count: memberCount, error: memberError } = await supabase
            .from("project_members")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id)
            .eq("status", "accepted");

          if (memberError) {
            console.error(
              `Error fetching members for project ${project.id}:`,
              memberError
            );
            return {
              projectId: project.id,
              projectName: project.name,
              memberCount: 0,
            };
          }

          return {
            projectId: project.id,
            projectName: project.name,
            memberCount: memberCount || 0,
          };
        });

        const memberResults = await Promise.all(memberPromises);
        projectsWithMembers.push(...memberResults);
        maxMembersInProject = Math.max(
          ...memberResults.map((p) => p.memberCount),
          0
        );
      }

      // Wait for subscription to be loaded before setting limits
      // This prevents setting wrong limits before subscription data is available
      const planInfo = getPlanInfo();

      // Set limits based on plan with comprehensive edge case handling
      let projectsLimit, storageLimit, membersLimit;

      console.log("Setting limits based on plan:", {
        isProPlan: planInfo.isProPlan,
        subscription_storage_gb: subscription?.storage_gb,
      });

      if (planInfo.isProPlan) {
        projectsLimit = Infinity; // Unlimited
        storageLimit = subscription?.storage_gb || 250; // Use subscription storage or default
        membersLimit = Infinity; // Unlimited per project
      } else {
        // Free plan or expired/cancelled plans default to free limits
        projectsLimit = 2;
        storageLimit = 0.5; // 500MB in GB
        membersLimit = 2; // Per project
      }

      console.log("Final limits:", {
        projectsLimit,
        storageLimit,
        membersLimit,
      });

      // Find projects that are approaching or at member limits (for free plan only)
      const projectsWithMemberLimits = planInfo.isFreePlan
        ? projectsWithMembers.filter(
            (project) => project.memberCount >= Math.floor(membersLimit * 0.8)
          )
        : [];

      setUsageStats({
        projectsUsed: projectsCount || 0,
        projectsLimit,
        storageUsed: Number(storageUsedGB.toFixed(3)),
        storageLimit,
        maxMembersInProject,
        membersLimit,
        projectsWithMemberLimits,
      });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    } finally {
      setIsUsageLoading(false);
    }
  };

  // Fetch subscription on component mount
  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  // Fetch usage stats only after subscription is loaded
  useEffect(() => {
    if (!isSubscriptionLoading) {
      fetchUsageStats();
    }
  }, [user?.id, isSubscriptionLoading, subscription]);

  // Only calculate plan info when subscription is loaded
  const planInfo = !isSubscriptionLoading ? getPlanInfo() : null;

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb.toFixed(1)}GB`;
  };

  const getProgressValue = (used: number, limit: number) => {
    if (limit === Infinity) return 0; // Don't show progress for unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getRemainingText = (used: number, limit: number, unit: string) => {
    if (limit === Infinity) return `Unlimited ${unit}`;
    const remaining = limit - used;
    return `${formatNumber(remaining > 0 ? remaining : 0)} ${unit} remaining`;
  };

  const getStorageRemainingText = () => {
    if (usageStats.storageLimit === Infinity) return "Unlimited storage";
    const remaining = usageStats.storageLimit - usageStats.storageUsed;
    return `${formatStorage(Math.max(remaining, 0))} remaining`;
  };

  const getMembersRemainingText = () => {
    if (usageStats.membersLimit === Infinity) return "Unlimited per project";
    return `Max ${formatNumber(usageStats.membersLimit)} per project`;
  };

  const getUsageColor = (used: number, limit: number) => {
    if (limit === Infinity) return "default";
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return "destructive";
    if (percentage >= 90) return "destructive";
    if (percentage >= 80) return "warning";
    return "default";
  };

  const formatDaysUntilExpiry = (days: number) => {
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day remaining";
    if (days < 30) return `${days} days remaining`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month remaining";
    return `${months} months remaining`;
  };

  const refreshData = () => {
    fetchSubscription();
    if (!isSubscriptionLoading) {
      fetchUsageStats();
    }
  };

  // Show loading state while data is being fetched
  const isLoading = isSubscriptionLoading || isUsageLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usage & Limits</h3>
          <p className="text-sm text-muted-foreground">
            Track your current usage and plan limits
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Plan Status Alerts - Only show when data is loaded */}
      {!isSubscriptionLoading && planInfo && (
        <>
          {planInfo.isCancelled && planInfo.isWithinBillingPeriod && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 ">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />

              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Subscription cancelled.</span>{" "}
                    Your Pro features will remain active until{" "}
                    {subscription?.current_period_end &&
                      formatDate(subscription.current_period_end)}
                    .{" "}
                    <span className="font-medium">
                      {formatDaysUntilExpiry(planInfo.daysUntilExpiry)}
                    </span>
                  </div>
                  <Link href="/pricing">
                    <Button size="sm" className="ml-4 gap-1">
                      Reactivate
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {planInfo.isExpired && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Subscription expired.</span>{" "}
                    Your account has been reverted to the Free plan. Upgrade to
                    restore Pro features.
                  </div>
                  <Link href="/pricing">
                    <Button size="sm" className="ml-4 gap-1">
                      Upgrade Now
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Usage Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Projects Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : usageStats.projectsLimit === Infinity ? (
                  <div className="flex items-center gap-2">
                    {formatNumber(usageStats.projectsUsed)}
                    <Badge variant="secondary" className="text-xs">
                      Unlimited
                    </Badge>
                  </div>
                ) : (
                  `${formatNumber(usageStats.projectsUsed)} / ${formatNumber(usageStats.projectsLimit)}`
                )}
              </div>

              {usageStats.projectsLimit !== Infinity && !isLoading && (
                <Progress
                  value={getProgressValue(
                    usageStats.projectsUsed,
                    usageStats.projectsLimit
                  )}
                  className={cn(
                    "h-2",
                    getUsageColor(
                      usageStats.projectsUsed,
                      usageStats.projectsLimit
                    ) === "destructive" && "bg-destructive/20",
                    getUsageColor(
                      usageStats.projectsUsed,
                      usageStats.projectsLimit
                    ) === "warning" && "bg-yellow-200"
                  )}
                />
              )}

              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : getRemainingText(
                      usageStats.projectsUsed,
                      usageStats.projectsLimit,
                      "projects"
                    )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <ServerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                ) : usageStats.storageLimit === Infinity ? (
                  <div className="flex items-center gap-2">
                    {formatStorage(usageStats.storageUsed)}
                    <Badge variant="secondary" className="text-xs">
                      Unlimited
                    </Badge>
                  </div>
                ) : (
                  `${formatStorage(usageStats.storageUsed)} / ${formatStorage(usageStats.storageLimit)}`
                )}
              </div>

              {usageStats.storageLimit !== Infinity && !isLoading && (
                <Progress
                  value={getProgressValue(
                    usageStats.storageUsed,
                    usageStats.storageLimit
                  )}
                  className={cn(
                    "h-2",
                    getUsageColor(
                      usageStats.storageUsed,
                      usageStats.storageLimit
                    ) === "destructive" && "bg-destructive/20",
                    getUsageColor(
                      usageStats.storageUsed,
                      usageStats.storageLimit
                    ) === "warning" && "bg-yellow-200"
                  )}
                />
              )}

              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : getStorageRemainingText()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Per Project */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : usageStats.membersLimit === Infinity ? (
                  <div className="flex items-center gap-2">
                    {formatNumber(usageStats.maxMembersInProject)}
                    <Badge variant="secondary" className="text-xs">
                      Unlimited
                    </Badge>
                  </div>
                ) : (
                  `${formatNumber(usageStats.maxMembersInProject)} / ${formatNumber(usageStats.membersLimit)}`
                )}
              </div>

              {usageStats.membersLimit !== Infinity && !isLoading && (
                <Progress
                  value={getProgressValue(
                    usageStats.maxMembersInProject,
                    usageStats.membersLimit
                  )}
                  className={cn(
                    "h-2",
                    getUsageColor(
                      usageStats.maxMembersInProject,
                      usageStats.membersLimit
                    ) === "destructive" && "bg-destructive/20",
                    getUsageColor(
                      usageStats.maxMembersInProject,
                      usageStats.membersLimit
                    ) === "warning" && "bg-yellow-200"
                  )}
                />
              )}

              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : getMembersRemainingText()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Information - Only show when subscription is loaded */}
      {!isSubscriptionLoading && planInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Current Plan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={planInfo.isFreePlan ? "secondary" : "default"}
                  >
                    {planInfo.planDisplayName}
                  </Badge>
                  {planInfo.isCancelled && planInfo.isWithinBillingPeriod && (
                    <Badge variant="outline" className="text-xs">
                      {formatDaysUntilExpiry(planInfo.daysUntilExpiry)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Projects</span>
                <span className="text-sm font-medium">
                  {planInfo.isFreePlan
                    ? "2 projects max"
                    : "Unlimited projects"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm font-medium">
                  {planInfo.isFreePlan
                    ? "500MB max"
                    : `${formatStorage(usageStats.storageLimit)} max`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Team Members
                </span>
                <span className="text-sm font-medium">
                  {planInfo.isFreePlan
                    ? "2 members per project max"
                    : "Unlimited members per project"}
                </span>
              </div>
              {subscription && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium">
                    {formatStatus(subscription.status)}
                  </span>
                </div>
              )}
              {subscription?.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {planInfo.isCancelled ? "Expires" : "Renews"}
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Warnings - Only show when all data is loaded */}
      {!isLoading && planInfo && (
        <div className="space-y-4">
          {/* Storage Warning */}
          {usageStats.storageLimit !== Infinity &&
            getProgressValue(usageStats.storageUsed, usageStats.storageLimit) >
              80 && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        Storage limit approaching.
                      </span>{" "}
                      You're using{" "}
                      {(
                        (usageStats.storageUsed / usageStats.storageLimit) *
                        100
                      ).toFixed(1)}
                      % of your storage.
                      {planInfo.isFreePlan &&
                        " Upgrade to Pro for more storage."}
                    </div>
                    {planInfo.isFreePlan && (
                      <Link href="/pricing">
                        <Button size="sm" className="ml-4 gap-1">
                          Upgrade to Pro
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

          {/* Project Limit Warning */}
          {usageStats.projectsLimit !== Infinity &&
            usageStats.projectsUsed >= usageStats.projectsLimit && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        Project limit reached.
                      </span>{" "}
                      You've reached your maximum number of projects.
                      {planInfo.isFreePlan &&
                        " Upgrade to Pro for unlimited projects."}
                    </div>
                    {planInfo.isFreePlan && (
                      <Link href="/pricing">
                        <Button size="sm" className="ml-4 gap-1">
                          Upgrade to Pro
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

          {/* Members Per Project Warning */}
          {usageStats.membersLimit !== Infinity &&
            usageStats.maxMembersInProject >= usageStats.membersLimit && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <UsersIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        Project member limit reached.
                      </span>{" "}
                      One or more of your projects has reached the maximum
                      number of team members (
                      {formatNumber(usageStats.membersLimit)} per project).
                      {planInfo.isFreePlan &&
                        " Upgrade to Pro for unlimited members per project."}
                    </div>
                    {planInfo.isFreePlan && (
                      <Link href="/pricing">
                        <Button size="sm" className="ml-4 gap-1">
                          Upgrade to Pro
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

          {/* Individual Project Member Warnings */}
          {planInfo.isFreePlan &&
            usageStats.projectsWithMemberLimits.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <UsersIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          Project member limits approaching.
                        </span>{" "}
                        The following projects are near their member limits:
                      </div>
                      <Link href="/pricing">
                        <Button size="sm" className="ml-4 gap-1">
                          Upgrade to Pro
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                    <ul className="text-sm space-y-1">
                      {usageStats.projectsWithMemberLimits.map((project) => (
                        <li
                          key={project.projectId}
                          className="flex justify-between"
                        >
                          <span>{project.projectName}</span>
                          <span className="font-medium">
                            {formatNumber(project.memberCount)} /{" "}
                            {formatNumber(usageStats.membersLimit)} members
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading usage data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
