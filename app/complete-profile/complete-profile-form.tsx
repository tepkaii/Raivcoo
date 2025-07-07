"use client";
import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { validateDisplayName } from "../dashboard/profile/displayNameValidation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

interface ProfileData {
  email: string | number | readonly string[] | undefined;
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface ProfileFormProps {
  profile: ProfileData;
  updateProfile: (formData: FormData) => Promise<{ message: string }>;
  returnTo?: string;
}

const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;
const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 50;

export default function CompleteProfileForm({
  profile,
  updateProfile,
  returnTo,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [isDisplayNameTouched, setIsDisplayNameTouched] = useState(false);
  const [isFullNameTouched, setIsFullNameTouched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);
  const [displayNameErrors, setDisplayNameErrors] = useState<string[]>([]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
    };
  }, [previewAvatarUrl]);

  // Validation flags
  const isFullNameValid =
    fullName.length >= MIN_FULL_NAME_LENGTH &&
    fullName.length <= MAX_FULL_NAME_LENGTH;

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value.toLowerCase());
  };

  const handleDisplayNameBlur = async () => {
    setIsDisplayNameTouched(true);
    if (displayName !== profile?.display_name) {
      startTransition(async () => {
        const validationResult = await validateDisplayName(
          displayName,
          profile?.display_name || ""
        );
        setIsDisplayNameValid(validationResult.isValid);
        setDisplayNameErrors(validationResult.errors);
      });
    } else {
      setIsDisplayNameValid(true);
      setDisplayNameErrors([]);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setNewAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatarUrl(previewUrl);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate display name
    if (!isDisplayNameValid || displayName.length < MIN_DISPLAY_NAME_LENGTH) {
      toast({
        title: "Validation Error",
        description: "Please check your display name and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate full name
    if (!fullName || fullName.trim() === "" || !isFullNameValid) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid full name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.set("display_name", displayName.toLowerCase());
    formData.set("full_name", fullName.trim());

    // Add avatar if selected
    if (newAvatarFile) {
      formData.set("avatar", newAvatarFile);
    }

    // Add returnTo to form data if provided
    if (returnTo) {
      formData.set("returnTo", returnTo);
    }

    try {
      const result = await updateProfile(formData);

      toast({
        title: "Profile Completed!",
        description: result.message,
        variant: "green",
      });

      // The redirect will be handled by the server action
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: `Failed to complete profile: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCharacterCount = (
    current: number,
    min: number,
    max: number,
    isTouched: boolean
  ) => {
    const isValid = current >= min && current <= max;
    const showError = isTouched && !isValid;
    const showSuccess = isTouched && isValid;

    let color = "text-muted-foreground"; // Default state
    if (showError) {
      color = "text-red-500"; // Error state
    } else if (showSuccess) {
      color = "text-green-500"; // Success state
    }

    return (
      <p className={`text-sm ${color} mt-1 flex items-center`}>
        {showError ? (
          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
        ) : showSuccess ? (
          <CheckCircleIcon className="w-4 h-4 mr-1" />
        ) : (
          <CheckCircleIcon className="w-4 h-4 mr-1" />
        )}
        {current}/{max} characters
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 w-full">
      <div className="mb-6 text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Complete Your Profile
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Just a few details and you'll be ready to go!
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-primary-foreground space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div
              className="group relative cursor-pointer"
              onClick={() => document.getElementById("avatar-upload")?.click()}
              role="button"
              aria-label="Upload profile picture"
              tabIndex={0}
            >
              <Avatar className="h-20 w-20 rounded-xl ">
                <AvatarImage
                  src={previewAvatarUrl || profile.avatar_url || ""}
                  alt="Profile"
                />
                <AvatarFallback className="bg-muted rounded-xl">
                  <Image
                    src="/avif/user-profile-avatar.avif"
                    alt="Default Avatar"
                    width={80}
                    height={80}
                    className="rounded-xl"
                  />
                </AvatarFallback>
              </Avatar>

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                  <CameraIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
              aria-label="Upload profile picture"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click to upload a profile picture (optional)
          </p>
        </div>

        {/* Full Name Input */}
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <div className="space-y-2 mt-2">
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setIsFullNameTouched(true)}
              className={
                !isFullNameValid && isFullNameTouched
                  ? "ring-red-500/30 border-red-500 ring-[3px] border"
                  : ""
              }
              placeholder="Enter your full name"
              required
            />

            {renderCharacterCount(
              fullName.length,
              MIN_FULL_NAME_LENGTH,
              MAX_FULL_NAME_LENGTH,
              isFullNameTouched
            )}
          </div>
        </div>

        {/* Display Name Input */}
        <div>
          <Label htmlFor="display_name">Display Name</Label>
          <div className="space-y-2 mt-2">
            <Input
              type="text"
              name="display_name"
              id="display_name"
              value={displayName}
              onChange={handleDisplayNameChange}
              onBlur={handleDisplayNameBlur}
              className={
                !isDisplayNameValid && isDisplayNameTouched
                  ? "ring-red-500/30 border-red-500 ring-[3px] border"
                  : ""
              }
              placeholder="Choose your display name"
              required
              autoCapitalize="none"
              style={{ textTransform: "lowercase" }}
            />

            {isPending && (
              <p className="text-sm text-muted-foreground flex items-center">
                <span className="animate-spin mr-2">
                  <ArrowPathIcon className="h-4 w-4"></ArrowPathIcon>
                </span>
                Checking availability...
              </p>
            )}

            {displayNameErrors.length > 0 && !isPending && (
              <ul className="text-sm text-red-500 space-y-1">
                {displayNameErrors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <ExclamationCircleIcon className="mr-2 h-4 w-4" />
                    {error}
                  </li>
                ))}
              </ul>
            )}

            {renderCharacterCount(
              displayName.length,
              MIN_DISPLAY_NAME_LENGTH,
              MAX_DISPLAY_NAME_LENGTH,
              isDisplayNameTouched
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            isLoading ||
            isPending ||
            !isDisplayNameValid ||
            !isFullNameValid ||
            !fullName.trim() ||
            !displayName.trim()
          }
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up your profile...
            </>
          ) : (
            "Complete Profile"
          )}
        </Button>
      </div>
    </form>
  );
}
