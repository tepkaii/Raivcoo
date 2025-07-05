// app/settings/notifications/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NotificationSettings } from "./NotificationSettings";
import { getNotificationPreferences, ensureUserPreferences } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure user has preferences record
  await ensureUserPreferences();

  // Get current preferences
  const result = await getNotificationPreferences();

  if (!result.success) {
    console.error("Failed to load preferences:", result.error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications for projects and activities.
          </p>
        </div>

        <NotificationSettings initialPreferences={result.preferences || {}} />
      </div>
    </div>
  );
}
