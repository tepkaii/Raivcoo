"use client";

import { Card } from "@/components/ui/card";
import ProfileForm from "./ProfileForm";
import PasswordSection from "../settings/Tabs/components/PasswordSection";
import { updateProfile } from "./ProfileActions";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ProfileClientProps {
  user: any;
  profile: any;
  hasPasswordAuth: boolean;
}

export default function ProfileClient({
  user,
  profile,
  hasPasswordAuth,
}: ProfileClientProps) {
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <SidebarTrigger />
          <div className="border-r ml-1 border-l flex items-center h-full gap-3">
            <h1 className="text-xl ml-4 mr-4">Profile Information</h1>
          </div>
        </div>
      </header>
      <div className=" p-6 space-y-8">
        {/* Profile Information */}
        <Card className="p-6">
          <div className="space-y-6">
            <ProfileForm Profile={profile} updateProfile={updateProfile} />
          </div>
        </Card>

        {/* Password & Security */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Password & Security</h3>
              <p className="text-sm text-muted-foreground">
                Manage your password and security settings.
              </p>
            </div>

            <PasswordSection
              hasPassword={hasPasswordAuth}
              email={profile.email || user.email || ""}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
