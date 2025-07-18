"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug } from "lucide-react";
import Image from "next/image";

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
    <div className="space-y-6 select-none">
      <div>
        <h3 className="text-lg font-medium">Adobe Extensions</h3>
        <p className="text-sm text-muted-foreground">
          Download and manage Raivcoo extensions for Adobe Creative Cloud apps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Adobe Creative Cloud Extensions
            <Badge variant="secondary">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 ">
                <Image
                  src="/app/Adobe Premiere Pro.png"
                  alt="Adobe Premiere Pro"
                  width={40}
                  height={40}
                  className="rounded"
                />
                <div>
                  <h4 className="font-medium">Adobe Premiere Pro</h4>
                  <p className="text-sm text-muted-foreground">
                    See client feedback directly in your timeline
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Image
                  src="/app/Adobe After Effects.png"
                  alt="Adobe After Effects"
                  width={40}
                  height={40}
                  className="rounded"
                />
                <div>
                  <h4 className="font-medium">Adobe After Effects</h4>
                  <p className="text-sm text-muted-foreground">
                    See client feedback directly in your timeline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}