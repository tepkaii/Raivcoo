// app/activity/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ActivityFeed } from "./ActivityFeed";
import { getActivityNotifications, getUnreadActivityCount } from "./actions";

export default async function ActivityPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get activities and unread count
  const [activitiesResult, unreadResult] = await Promise.all([
    getActivityNotifications(50),
    getUnreadActivityCount(),
  ]);

  if (!activitiesResult.success) {
    console.error("Failed to load activities:", activitiesResult.error);
  }

  if (!unreadResult.success) {
    console.error("Failed to load unread count:", unreadResult.error);
  }

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b px-3 h-[50px] flex items-center sticky top-0 z-50">
        <h1 className="ml-4 text-lg font-medium">Activity</h1>
        {unreadResult.success && unreadResult.count > 0 && (
          <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {unreadResult.count}
          </span>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        <ActivityFeed
          activities={activitiesResult.activities || []}
          unreadCount={unreadResult.count || 0}
        />
      </main>
    </div>
  );
}
