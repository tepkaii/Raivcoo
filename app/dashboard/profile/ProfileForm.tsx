"use client";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { validateDisplayName } from "./displayNameValidation";
import Image from "next/image";

import { timeZones } from "@/utils/timezones";
import { Button } from "@/components/ui/button";
import { CameraIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

export interface ProfileData {
  email: string;
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  timezone?: string;
  country?: string;
}

interface ProfileFormProps {
  Profile: ProfileData;
  updateProfile: (formData: FormData) => Promise<{ message: string }>;
}

const MIN_FULL_NAME_LENGTH = 5;
const MAX_FULL_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;

export default function ProfileForm({
  Profile,
  updateProfile,
}: ProfileFormProps) {
  const [displayNameErrors, setDisplayNameErrors] = useState<string[]>([]);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(Profile.full_name);
  const [displayName, setDisplayName] = useState(Profile.display_name);
  const [timezone, setTimezone] = useState(Profile.timezone || "UTC");
  const [country, setCountry] = useState(Profile.country || "");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);

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
  const isFormValid = isFullNameValid && isDisplayNameValid;

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleDisplayNameBlur = async () => {
    if (displayName !== Profile.display_name) {
      startTransition(async () => {
        const validationResult = await validateDisplayName(
          displayName,
          Profile.display_name
        );
        setIsDisplayNameValid(validationResult.isValid);
        setDisplayNameErrors(validationResult.errors);
      });
    } else {
      setIsDisplayNameValid(true);
      setDisplayNameErrors([]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      // Handle avatar upload
      if (newAvatarFile) {
        formData.set("image", newAvatarFile);
      }

      // Add form data
      formData.set("full_name", fullName);
      formData.set("display_name", displayName.toLowerCase());
      formData.set("timezone", timezone);
      formData.set("country", country);

      // Submit form
      const result = await updateProfile(formData);

      toast({
        title: "Success",
        description: result.message,
        variant: "green",
      });

      // Clean up preview URL
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        setPreviewAvatarUrl(null);
      }

      setNewAvatarFile(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 32 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 32MB",
          variant: "destructive",
        });
        return;
      }
      setNewAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatarUrl(previewUrl);
    }
  };

  // Simplified character count display
  const renderCharacterCount = (current: number, min: number, max: number) => {
    const isValid = current >= min && current <= max;
    return (
      <p
        className={`text-sm ${isValid ? "text-green-500" : "text-red-500"} mt-1`}
      >
        {current}/{max}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Profile Header with Avatar */}
        <div className="flex flex-col sm:flex-row w-full items-center gap-6">
          {/* Avatar and name */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className="group relative cursor-pointer"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
                role="button"
                aria-label="Change profile picture"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    document.getElementById("avatar-upload")?.click();
                  }
                }}
              >
                <Avatar className="h-20 w-20 rounded-xl border-2 border-primary/10 shadow-sm">
                  <AvatarImage
                    src={previewAvatarUrl || Profile.avatar_url}
                    loading="lazy"
                    alt={Profile.display_name}
                  />
                  <AvatarFallback className="bg-muted rounded-none">
                    <Image
                      src={"/avif/user-profile-avatar.avif"}
                      alt={Profile.display_name || "User Avatar"}
                      fill
                      loading="lazy"
                    />
                  </AvatarFallback>
                </Avatar>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-[10px] p-2">
                    <CameraIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* New avatar indicator */}
              {newAvatarFile && (
                <div className="absolute -bottom-1 -right-1 bg-green-900 text-green-500 rounded-[5px] p-1">
                  <CheckCircleIcon className="h-4 w-4" />
                </div>
              )}

              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
                aria-label="Upload profile picture"
              />
            </div>

            {/* Name info */}
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">{Profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                @{Profile.display_name}
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`mt-1 ${!isFullNameValid && fullName.length > 0 ? "border-red-500" : ""}`}
              required
              placeholder="Enter your full name"
            />
            {renderCharacterCount(
              fullName.length,
              MIN_FULL_NAME_LENGTH,
              MAX_FULL_NAME_LENGTH
            )}
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              type="text"
              name="display_name"
              id="display_name"
              value={displayName}
              onChange={(e) => {
                const lowercaseValue = e.target.value.toLowerCase();
                handleDisplayNameChange({
                  ...e,
                  target: { ...e.target, value: lowercaseValue },
                });
              }}
              onBlur={handleDisplayNameBlur}
              className={`mt-1 ${!isDisplayNameValid ? "border-red-500" : ""}`}
              placeholder="Choose your display name"
              required
              autoCapitalize="none"
              style={{ textTransform: "lowercase" }}
            />
            {renderCharacterCount(
              displayName.length,
              MIN_DISPLAY_NAME_LENGTH,
              MAX_DISPLAY_NAME_LENGTH
            )}

            {isPending && (
              <p className="text-sm text-gray-500">Checking availability...</p>
            )}

            {displayNameErrors.length > 0 && !isPending && (
              <ul className="text-sm text-red-500 mt-1">
                {displayNameErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Email - Non-editable */}
          <div>
            <Label htmlFor="Email">Email</Label>
            <Input
              type="text"
              name="Email"
              disabled={true}
              id="Email"
              value={Profile.email}
              className="cursor-not-allowed mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to update your email address
            </p>
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              type="text"
              name="country"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1"
              placeholder="Enter your country"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your location helps with regional features
            </p>
          </div>

          {/* Time Zone - Full width */}
          <div className="md:col-span-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select
              name="timezone"
              value={timezone}
              onValueChange={(value) => setTimezone(value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {/* Group timezones by region */}
                {Array.from(new Set(timeZones.map((tz) => tz.region))).map(
                  (region) => (
                    <SelectGroup key={region}>
                      <SelectLabel className="text-sm text-muted-foreground">
                        {region}
                      </SelectLabel>
                      {timeZones
                        .filter((tz) => tz.region === region)
                        .map((tz) => (
                          <SelectItem key={tz.zone} value={tz.zone}>
                            {tz.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  )
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Your time zone helps with project deadlines and notifications
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !isFormValid || isPending}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>

        {/* Support info */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Need help? Contact us at{" "}
            <a
              href="mailto:ravivcoo@gmail.com"
              className="hover:underline transition-all"
            >
              Ravivcoo@gmail.com
            </a>{" "}
            or{" "}
            <a
              href="https://twitter.com/raivcoo"
              className="hover:underline transition-all"
            >
              Twitter
            </a>
          </p>
        </div>
      </div>
    </form>
  );
}
