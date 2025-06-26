// app/review/[token]/not-found.tsx
import Link from "next/link";

import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Review Link Not Found</h1>
          <p className="text-muted-foreground">
            This review link is either invalid, has been deleted, or has
            expired.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the person who
            shared this link with you.
          </p>

          <Link href="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
