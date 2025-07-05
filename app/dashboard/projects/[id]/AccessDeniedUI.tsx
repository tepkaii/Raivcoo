// components/AccessDeniedUI.tsx
"use client";

import { Clock, X, Lock, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  ClockIcon,
  HomeIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/solid";

interface ProjectAccessCheck {
  has_access: boolean;
  role: string | null;
  is_owner: boolean;
  project_exists: boolean;
  membership_status: string | null;
}

interface AccessDeniedUIProps {
  accessCheck: ProjectAccessCheck;
}

export function AccessDeniedUI({ accessCheck }: AccessDeniedUIProps) {
  const getMessage = () => {
    if (accessCheck.membership_status === "pending") {
      return {
        title: "Invitation Pending",
        message:
          "You have a pending invitation to this project. Check your email or contact the project owner.",
        icon: ClockIcon,
        iconColor: "text-amber-300",
        bgColor: "bg-amber-800",
        borderColor: "border-black/20",
      };
    }

    if (accessCheck.membership_status === "declined") {
      return {
        title: "Access Declined",
        message:
          "Your access to this project has been declined. Contact the project owner if you believe this is an error.",
        icon: X,
        iconColor: "text-red-300",
        bgColor: "bg-destructive",
        borderColor: "border-black/20",
      };
    }

    return {
      title: "Access Denied",
      message: "You don't have permission to view this project.",
      icon: LockClosedIcon,
      iconColor: "text-red-300",
      bgColor: "bg-destructive",
      borderColor: "border-black/20",
    };
  };

  const {
    title,
    message,
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
  } = getMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 px-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div
              className={`mx-auto flex items-center justify-center h-16 w-16 rounded-[5px] ${bgColor} ${borderColor} border-2`}
            >
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">{message}</p>
          </div>

          {/* Help Section */}
          <div className="space-y-4 mb-8">
            <p className="text-sm font-medium text-muted-foreground">
              What you can do:
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Contact the project owner to request access
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Make sure you're logged in with the correct account
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Check your email for pending invitations
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="flex-1">
              <a href="/dashboard">
                <HomeIcon className="mr-2 h-4 w-4" />
                Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
