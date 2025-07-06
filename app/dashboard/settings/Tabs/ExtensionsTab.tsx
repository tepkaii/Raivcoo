"use client";

import ExtensionsClient from "./components/extensions-client";

interface ExtensionsTabProps {
  hasPasswordAuth: boolean;
  email: string;
  profile: any;
}

export default function ExtensionsTab({
  hasPasswordAuth,
  email,
  profile,
}: ExtensionsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Adobe Extensions</h3>
        <p className="text-sm text-muted-foreground">
          Download and manage Raivcoo extensions for Adobe Creative Cloud apps.
        </p>
      </div>

      <ExtensionsClient
        hasPasswordAuth={hasPasswordAuth}
        email={email}
        profile={profile}
      />
    </div>
  );
}
