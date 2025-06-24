// app/review/[token]/PasswordProtectedReview.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface PasswordProtectedReviewProps {
  token: string;
  reviewTitle?: string;
  projectName?: string;
}

export function PasswordProtectedReview({
  token,
  reviewTitle,
  projectName,
}: PasswordProtectedReviewProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    if (!password.trim()) {
      setError("Please enter a password");
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch("/api/review/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        // Small delay to show success state before redirecting
        setTimeout(() => {
          router.push(`/review/${token}?authenticated=true`);
        }, 800);
      } else {
        setError(data.error || "Invalid password. Please try again.");
        setPassword(""); // Clear password on error
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Password verification failed:", error);
      setError("Connection error. Please check your internet and try again.");
      setIsVerifying(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-primary-foreground p-8 max-w-md w-full text-center">
          <div className="bg-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-600">
            Access Granted!
          </h1>
          <p className="text-muted-foreground">Loading your review...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-primary-foreground p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-100" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Required</h1>
          {reviewTitle && (
            <h2 className="text-lg font-semibold text-blue-600 mb-1">
              {reviewTitle}
            </h2>
          )}
          {projectName && (
            <p className="text-sm text-muted-foreground mb-3">
              Project: {projectName}
            </p>
          )}
          <p className="text-muted-foreground">
            This review is password protected. Please enter the password to
            continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                disabled={isVerifying}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isVerifying}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              "Access Review"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact the person who shared this review with you.
          </p>
        </div>
      </Card>
    </div>
  );
}
