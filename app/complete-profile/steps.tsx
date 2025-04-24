
"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CameraIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  countries,
} from "../../utils/ProfileOptions";
import { validateDisplayName } from "../dashboard/account/displayNameValidation";

import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuroraText } from "@/components/ui/aurora-text";



interface ProfileData {
  email: string | number | readonly string[] | undefined;
  user_id: string;
  full_name: string;
  display_name: string;
  country: string;
  biography: string;
  avatar_url: string;

}



interface ProfileFormProps {
  profile: ProfileData;
  updateProfile: (formData: FormData) => Promise<{ message: string }>;
}

const MIN_FULL_NAME_LENGTH = 5;
const MAX_FULL_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;



export default function CompleteProfileForm({
  profile,
  updateProfile,
}: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [displayNameErrors, setDisplayNameErrors] = useState<string[]>([]);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  const [fullName, setFullName] = useState(profile.full_name);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [country, setCountry] = useState(profile.country);
  const [isFullNameTouched, setIsFullNameTouched] = useState(false);
  const [isDisplayNameTouched, setIsDisplayNameTouched] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);

  // Validation functions
  const isFullNameValid =
    fullName.length >= MIN_FULL_NAME_LENGTH &&
    fullName.length <= MAX_FULL_NAME_LENGTH;
 

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value.toLowerCase());
  };

  const handleDisplayNameBlur = async () => {
    setIsDisplayNameTouched(true);
    if (displayName !== profile.display_name) {
      startTransition(async () => {
        const validationResult = await validateDisplayName(
          displayName,
          profile.display_name
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
      if (file.size > 32 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 32MB",
          variant: "destructive",
        });
        return;
      }
      setNewAvatarFile(file);
      setPreviewAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !isFullNameValid ||
      !isDisplayNameValid 
     
    ) {
      toast({
        title: "Validation Error",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    if (newAvatarFile) formData.set("image", newAvatarFile);
    formData.set("full_name", fullName);
    formData.set("display_name", displayName.toLowerCase());
    formData.set("country", country);

    try {
      const result = await updateProfile(formData);
      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });
      router.push("/portfolio"); // Redirect to profile page after submission
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update profile: ${(error as Error).message}`,
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
    const color = showError ? "text-red-500" : "text-muted-foreground";
    return (
      <p className={`text-sm ${color} mt-1 flex items-center`}>
        {showError ? (
          <AlertCircle className="w-4 h-4 mr-1" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mr-1" />
        )}
        {current}/{max} characters
      </p>
    );
  };

  const renderStep = () => {
    const StepHeader = ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => (
      <div className="mb-6 text-center">
        <h2 className="md:text-2xl text-xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="text-muted-foreground mt-2 md:text-base text-sm">
          {description}
        </p>
      </div>
    );

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <StepHeader
              title="Basic Information"
              description="Let's start with your basic details"
            />

            {/* Avatar Upload */}
            <div className="flex justify-center mb-8">
              <div
                className="relative group cursor-pointer"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={previewAvatarUrl || profile.avatar_url}
                    alt="Profile Avatar"
                  />
                  <AvatarFallback>
                    <Image
                      src="/avif/user-profile-avatar.avif"
                      alt="Default Avatar"
                      fill
                      loading="lazy"
                    />
                  </AvatarFallback>
                </Avatar>
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
            </div>

            <div className="space-y-4">
              {/* Full Name Input */}
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => setIsFullNameTouched(true)}
                        className={`mt-2 ${
                          isFullNameTouched && !isFullNameValid
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="Enter your full name"
                        required
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Your full name should be between 5 and 30 characters.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {renderCharacterCount(
                  fullName.length,
                  MIN_FULL_NAME_LENGTH,
                  MAX_FULL_NAME_LENGTH,
                  isFullNameTouched
                )}
              </div>

              {/* Display Name Input */}
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <div className="space-y-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          type="text"
                          name="display_name"
                          id="display_name"
                          value={displayName}
                          onChange={handleDisplayNameChange}
                          onBlur={handleDisplayNameBlur}
                          className={
                            !isDisplayNameValid ? "border-red-500" : ""
                          }
                          placeholder="Choose your display name"
                          required
                          autoCapitalize="none"
                          style={{ textTransform: "lowercase" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Your display name will be used in your profile URL.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm text-muted-foreground">
                    Your profile URL:{" "}
                    <span className="font-mono bg-muted px-2 py-0.5 rounded-full">
                      {displayName ? displayName.toLowerCase() : "username"}
                      .raivcoo.com
                    </span>
                  </p>
                  {isPending && (
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking availability...
                    </p>
                  )}
                  {displayNameErrors.length > 0 && !isPending && (
                    <ul className="text-sm text-red-500 space-y-1">
                      {displayNameErrors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {renderCharacterCount(
                  displayName.length,
                  MIN_DISPLAY_NAME_LENGTH,
                  MAX_DISPLAY_NAME_LENGTH,
                  isDisplayNameTouched
                )}
              </div>

              {/* Country Selection */}
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  name="country"
                  value={country}
                  onValueChange={(value) => setCountry(value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your country" />
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

            </div>

            <div className="flex justify-between pt-6">
              <div /> {/* Empty div for spacing */}
              <Button
                onClick={() => setStep(2)}
                disabled={
                  !isFullNameValid || !isDisplayNameValid
                }
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className=" max-w-7xl mx-auto p-6 min-h-screen "
    >
      <h1
        className="md:text-4xl mb-4 text-2xl font-bold tracking-tighter md:text-start
text-center  "
      >
        Complete Your <AuroraText>Profile</AuroraText>
      </h1>

      <div className="border rounded-[10px] p-5 bg-background">
        {renderStep()}
      </div>
    </form>
  );
}
