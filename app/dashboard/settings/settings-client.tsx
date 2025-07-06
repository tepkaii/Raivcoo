"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

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
  const [activeTab, setActiveTab] = useState("notifications");

  return (
    <div className="min-h-screen ">
      <Card className="p-6 bg-transparent border-transparent">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <TabsTrigger value="extensions" className="flex items-center gap-2">
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
  );
}
