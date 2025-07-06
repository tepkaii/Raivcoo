import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import SettingsClient from "./settings-client";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Settings - Raivcoo",
  description: "Manage your account settings, notifications, and preferences",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }

  // Check password auth
  const hasPasswordAuthFromIdentities = user.identities?.some(
    (identity) =>
      identity.provider === "email" &&
      identity.identity_data?.email === user.email
  );

  const hasPasswordAuth =
    profile?.has_password || hasPasswordAuthFromIdentities;

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false }) // Get most recent
    .limit(1)
    .maybeSingle();

  // Get orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get notification preferences
  const { data: notificationPrefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <SidebarTrigger />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <h1 className="text-xl ml-4 mr-4">Settings</h1>
          </div>
        </div>
      </header>
      <SettingsClient
        user={user}
        profile={profile}
        hasPasswordAuth={!!hasPasswordAuth}
        subscription={subscription}
        orders={orders || []}
        notificationPrefs={notificationPrefs}
      />
    </div>
  );
}
