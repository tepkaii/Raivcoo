"use client";

import { NotificationSettings } from "./components/NotificationSettings";

interface NotificationsTabProps {
  initialPreferences: any;
}

export default function NotificationsTab({
  initialPreferences,
}: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Manage how you receive notifications for projects and activities.
        </p>
      </div>

      <NotificationSettings initialPreferences={initialPreferences} />
    </div>
  );
}
