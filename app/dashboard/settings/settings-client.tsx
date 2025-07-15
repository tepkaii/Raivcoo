// app/dashboard/settings/settings-client.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Import individual tab components
import NotificationsTab from "./Tabs/NotificationsTab";
import SubscriptionTab from "./Tabs/SubscriptionTab";
import UsageTab from "./Tabs/UsageTab";
import ExtensionsTab from "./Tabs/ExtensionsTab";
import {
  BellIcon,
  ChartBarIcon,
  CreditCardIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/solid";

interface SettingsClientProps {
  user: any;
  profile: any;
  hasPasswordAuth: boolean;
  subscription: any;
  orders: any[];
  notificationPrefs: any;
}

export default function SettingsClient({
  user,
  profile,
  hasPasswordAuth,
  subscription,
  orders,
  notificationPrefs,
}: SettingsClientProps) {
  const searchParams = useSearchParams();

  // Get initial tab from URL or default to notifications
  const getInitialTab = () => {
    return searchParams.get("tab") || "notifications";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Get display name for current tab
  const getTabDisplayName = (tab: string) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  // Handle tab change with URL update (NO server request)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);

    // Update URL without triggering navigation
    const url = new URL(window.location.href);
    if (newTab === "notifications") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", newTab);
    }

    // Use pushState to update URL without server request
    window.history.pushState({}, "", url.pathname + url.search);
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get("tab") || "notifications";
      setActiveTab(tabFromUrl);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update tab if URL changes on initial load
  useEffect(() => {
    const tabFromUrl = getInitialTab();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return (
    <div>
      {/* Header - updates instantly */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <SidebarTrigger />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <h1 className="text-xl ml-4 mr-4">
              Settings - {getTabDisplayName(activeTab)}
            </h1>
          </div>
        </div>
      </header>

      {/* Settings content */}
      <div className="min-h-screen">
        <Card className="p-6 bg-transparent border-transparent">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <BellIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="flex items-center gap-2"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Usage</span>
              </TabsTrigger>
              <TabsTrigger
                value="extensions"
                className="flex items-center gap-2"
              >
                <PuzzlePieceIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Extensions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationsTab initialPreferences={notificationPrefs || {}} />
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <SubscriptionTab
                user={user}
                subscription={subscription}
                orders={orders}
              />
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <UsageTab user={user} />
            </TabsContent>

            <TabsContent value="extensions" className="space-y-6">
              <ExtensionsTab
                hasPasswordAuth={hasPasswordAuth}
                email={user.email || ""}
                profile={profile}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
