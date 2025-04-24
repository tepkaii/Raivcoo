//ProfileForm.tsx file

"use client";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CameraIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { countries } from "../../../utils/ProfileOptions";
import { validateDisplayName } from "./displayNameValidation";
import Image from "next/image";

interface AccountData {
  email: string | number | readonly string[] | undefined;
  user_id: string;
  full_name: string;
  display_name: string;
  country: string;
  avatar_url: string;
  account_type: "editor" | "client";
}

interface AccountFormProps {
  Account: AccountData;
  updateAccount: (formData: FormData) => Promise<{ message: string }>;
}

const MIN_FULL_NAME_LENGTH = 5;
const MAX_FULL_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;
//

export default function AccountForm({
  Account,
  updateAccount,
}: AccountFormProps) {
  const [displayNameErrors, setDisplayNameErrors] = useState<string[]>([]);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
    };
  }, [, previewAvatarUrl]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(Account.full_name);
  const [displayName, setDisplayName] = useState(Account.display_name);
  const [country, setCountry] = useState(Account.country);
  const [accountType, setAccountType] = useState<"editor" | "client">(
    Account.account_type || "editor"
  );
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);
  // isFullNameValid
  const isFullNameValid =
    fullName.length >= MIN_FULL_NAME_LENGTH &&
    fullName.length <= MAX_FULL_NAME_LENGTH;
  // isFormValid
  const isFormValid = isFullNameValid && isDisplayNameValid;
  //
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };
  const handleDisplayNameBlur = async () => {
    if (displayName !== Account.display_name) {
      startTransition(async () => {
        const validationResult = await validateDisplayName(
          displayName,
          Account.display_name
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
      // Handle avatar and banner uploads
      if (newAvatarFile) {
        formData.set("image", newAvatarFile);
      }

      // Add other form data
      formData.set("full_name", fullName);
      formData.set("display_name", displayName.toLowerCase()); // Ensure lowercase when saving
      formData.set("country", country);
      formData.set("account_type", accountType);

      // Submit form
      const result = await updateAccount(formData);

      // Show success message
      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });

      // Clean up preview URLs
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        setPreviewAvatarUrl(null);
      }

      // Reset file states
      setNewAvatarFile(null);

      // Refresh the page to show updated data
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
      // Just create local preview and store file
      setNewAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatarUrl(previewUrl);
    }
  };
  const renderCharacterCount = (current: number, min: number, max: number) => {
    const isValid = current >= min && current <= max;
    const isEmpty = current === 0;
    const isOverMax = current > max;
    const isUnderMin = current > 0 && current < min;

    const color = isEmpty
      ? "text-gray-500"
      : isOverMax || isUnderMin
        ? "text-red-500"
        : "text-green-500";

    return (
      <p className={`text-sm ${color} mt-1 flex items-center`}>
        {isValid ? (
          <CheckCircle2 className="w-4 h-4 mr-1" />
        ) : (
          <AlertCircle className="w-4 h-4 mr-1" />
        )}
        {current}/{max} characters
      </p>
    );
  };
  //
  return (
    <form onSubmit={handleSubmit} className="min-h-screen">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-4 mt-4">
          <div className="flex flex-col   justify-between p-4 rounded-lg sm:p-6 gap-4 sm:gap-4">
            <div className="flex flex-col  items-center  gap-4 sm:gap-6 w-full ">
              {/* Avatar Section */}
              <div
                className={`relative group cursor-pointer rounded-full  `}
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
              >
                <div className="relative">
                  <Avatar className="h-24 w-24  rounded-lg border-2">
                    <AvatarImage
                      src={previewAvatarUrl || Account.avatar_url}
                      loading="lazy"
                      alt={Account.display_name}
                    />
                    <AvatarFallback>
                      <Image
                        src={"/avif/user-profile-avatar.avif"}
                        alt={Account.display_name || "Editor Avatar"}
                        fill
                        loading="lazy"
                      />
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <CameraIcon className="h-6 w-6 text-white" />
                </div>

                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* User Info Section */}
              <div className="flex flex-col items-center mt-0 text-center">
                <h2 className=" text-2xl font-semibold">{Account.full_name}</h2>
                <p className="sm:text-sm text-base text-muted-foreground mt-1">
                  @{Account.display_name}
                </p>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={` mt-2 ${
                !isFullNameValid && fullName.length > 0 ? "border-red-500" : ""
              }`}
              required
              placeholder="Enter your full name"
            />
            {renderCharacterCount(
              fullName.length,
              MIN_FULL_NAME_LENGTH,
              MAX_FULL_NAME_LENGTH
            )}
          </div>
          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  name="display_name"
                  id="display_name"
                  value={displayName}
                  onChange={(e) => {
                    // Convert to lowercase immediately on input
                    const lowercaseValue = e.target.value.toLowerCase();
                    handleDisplayNameChange({
                      ...e,
                      target: { ...e.target, value: lowercaseValue },
                    });
                  }}
                  onBlur={handleDisplayNameBlur}
                  className={` ${!isDisplayNameValid ? "border-red-500" : ""}`}
                  placeholder="Choose your display name"
                  required
                  autoCapitalize="none" // Helps on mobile devices
                  style={{ textTransform: "lowercase" }} // Forces visual lowercase
                />
              </div>
            </div>
            {renderCharacterCount(
              displayName.length,
              MIN_DISPLAY_NAME_LENGTH,
              MAX_DISPLAY_NAME_LENGTH
            )}
            {isPending && (
              <p className="text-sm text-gray-500 mt-1">
                Checking availability...
              </p>
            )}
            {displayNameErrors.length > 0 && !isPending && (
              <ul className="text-sm text-red-500 mt-1">
                {displayNameErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <Label htmlFor="Email">Email</Label>
            <Input
              type="text"
              name="Email"
              disabled={true}
              id="Email"
              value={Account.email}
              className=" cursor-not-allowed mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              You cannot change your email address at this time
            </p>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              name="country"
              value={country}
              onValueChange={(value) => setCountry(value)}
            >
              <SelectTrigger className=" mt-2">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account_type">Account Type</Label>
            <Select
              name="account_type"
              value={accountType}
              onValueChange={(value) =>
                setAccountType(value as "editor" | "client")
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {accountType === "client"
                ? "As a client, you review videos and images sent by editors and decide whether to request revisions or approve them."
                : "As an editor, you send videos and images to clients for review and feedback."}
            </p>
          </div>

          <p className="text-sm text-muted-foreground flex flex-wrap gap-1">
            To Delete your account or Update your email, please contact us at{" "}
            <a
              href="mailto:ravivcoo@gmail.com"
              className="hover:underline transition-all  break-words"
            >
              Ravivcoo@gmail.com
            </a>
            /
            <a
              href="https://twitter.com/raivcoo"
              className="hover:underline transition-all  break-words"
            >
              Twitter
            </a>
          </p>

          <div className="py-6">
            <RevButtons
              variant={"success"}
              className=""
              type="submit"
              disabled={
                isLoading ||
                !isFormValid ||
                isPending ||
                fullName.length > MAX_FULL_NAME_LENGTH ||
                displayName.length > MAX_DISPLAY_NAME_LENGTH
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </RevButtons>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}