// app/dashboard/extensions/components/extensions-client.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldCheck,
  ArrowRight,
  Info,
  Download,
  AlertTriangle,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { EditorProfile } from "@/app/types/editorProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtensionsClientProps {
  hasPasswordAuth: boolean;
  email: string;
  profile: EditorProfile;
}

export default function ExtensionsClient({
  hasPasswordAuth,
  email,
  profile,
}: ExtensionsClientProps) {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Extensions
        </h1>
        <p className="text-muted-foreground">
          Download and use Raivcoo extensions for Adobe products
        </p>
      </div>

      {/* Password Security Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Adobe Extension Authentication
          </CardTitle>
          <CardDescription>
            You need to set up password authentication to use the Adobe
            extensions
          </CardDescription>
        </CardHeader>

        <CardContent>
          {hasPasswordAuth ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  ✓ Password is set up for this account
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can sign in to extensions using your email ({email}) and
                  password
                </p>
              </div>
              <RevButtons asChild variant="outline" size="sm">
                <Link href="/set-password">
                  Change Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </RevButtons>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  ⚠ No password set for this account
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You need to set a password to use the extensions with your
                  email ({email})
                </p>
              </div>
              <RevButtons asChild size="sm">
                <Link href="/set-password">
                  Set Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </RevButtons>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extensions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Adobe Extensions</CardTitle>
          <CardDescription>
            Download and install our extensions for Adobe Creative Cloud
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="premiere">
            <TabsList className="mb-4">
              <TabsTrigger value="premiere">Premiere Pro</TabsTrigger>
              <TabsTrigger value="aftereffects">After Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="premiere" className="space-y-4">
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Premiere Pro Extension</AlertTitle>
                <AlertDescription>
                  The Premiere Pro extension will be available soon.
                </AlertDescription>
              </Alert>

              <div className="flex items-center w-full justify-center py-4">
                <div className="bg-background w-full  border-2 border-dashed rounded-lg p-6 text-center">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground ">
                    Our Premiere Pro extension is currently in development and
                    will be available for download soon. Check back later!
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="aftereffects" className="space-y-4">
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>After Effects Extension</AlertTitle>
                <AlertDescription>
                  The After Effects extension will be available soon.
                </AlertDescription>
              </Alert>

              <div className="flex items-center w-full justify-center py-4">
                <div className="bg-background w-full  border-2 border-dashed rounded-lg p-6 text-center">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground ">
                    Our After Effects extension is currently in development and
                    will be available for download soon. Check back later!
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="border-t pt-4 flex flex-col space-y-4">
          <Alert variant="default" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Extension Login</AlertTitle>
            <AlertDescription>
              When logging into extensions, use your email address and the
              password you set for your account.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
          <CardDescription>
            How to install and use Raivcoo extensions in Adobe products
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Step 1: Download the Extension</h3>
            <p className="text-sm text-muted-foreground">
              Once available, download the extension package (.zxp file) from
              the links above.
            </p>
            {/* <a
              href="https://www.youtube.com/watch?v=1T7i9rjwM5c"
              className="text-sm text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch: How to download and locate your ZXP file
            </a> */}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 2: Install with ZXP Installer</h3>
            <p className="text-sm text-muted-foreground">
              Download the free{" "}
              <a
                className="underline text-violet-500"
                href="https://aescripts.com/learn/zxp-installer/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aescripts ZXP Installer
              </a>
              , then drag and drop the .zxp file into the app to install it.
            </p>
            {/* <a
              href="https://www.youtube.com/watch?v=8EAsHVe2pNg"
              className="text-sm text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch: How to install ZXP extensions with Aescripts installer
            </a> */}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 3: Login with Your Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Open the extension inside Adobe Premiere Pro or After Effects and
              log in using your Raivcoo email and password.
            </p>
            {/* <a
              href="https://www.youtube.com/watch?v=QpJLjhnLUlI"
              className="text-sm text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch: How to open and use installed extensions
            </a> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
