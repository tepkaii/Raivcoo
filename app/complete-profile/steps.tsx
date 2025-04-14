// @ts-nocheck
"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CameraIcon,
  Loader2,
  PlusCircle,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  languageOptions,
  skillOptions,
  genreOptions,
  languageLevels,
  countries,
  videoEditingSoftware,
} from "../../utils/ProfileOptions";
import { validateDisplayName } from "../dashboard/account/displayNameValidation";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuroraText } from "@/components/ui/aurora-text";

interface Language {
  language: string;
  level: string;
}

interface ProfileData {
  email: string | number | readonly string[] | undefined;
  availability: boolean;
  user_id: string;
  full_name: string;
  display_name: string;
  country: string;
  biography: string;
  avatar_url: string;
  banner_url: string;
  languages: Language[];
  skills: string[];
  preferred_genres: string[];
  software_proficiency: SoftwareProficiency[];
}

interface SoftwareProficiency {
  software: string;
  yearsOfExperience: number;
}

interface ProfileFormProps {
  profile: ProfileData;
  updateProfile: (formData: FormData) => Promise<{ message: string }>;
}

const MIN_FULL_NAME_LENGTH = 5;
const MAX_FULL_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;
const MIN_BIOGRAPHY_LENGTH = 100;
const MAX_BIOGRAPHY_LENGTH = 200;
const MAX_LANGUAGES = 5;
const MIN_SKILLS = 3;
const MAX_SKILLS = 5;
const MIN_GENRES = 3;
const MAX_GENRES = 5;
const MAX_SOFTWARE_PROFICIENCY = 5;

export default function CompleteProfileForm({
  profile,
  updateProfile,
}: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [displayNameErrors, setDisplayNameErrors] = useState<string[]>([]);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>(
    profile.languages || []
  );
  const [softwareProficiency, setSoftwareProficiency] = useState<
    SoftwareProficiency[]
  >(
    Array.isArray(profile.software_proficiency)
      ? profile.software_proficiency
      : []
  );
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [genres, setGenres] = useState<string[]>(
    profile.preferred_genres || []
  );
  const [fullName, setFullName] = useState(profile.full_name);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [biography, setBiography] = useState(profile.biography || "");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedSoftware, setSelectedSoftware] = useState<string>("");
  const [availability, setAvailability] = useState(
    profile.availability || false
  );
  const [isSkillsTouched, setIsSkillsTouched] = useState(false);
  const [country, setCountry] = useState(profile.country);
  const [isFullNameTouched, setIsFullNameTouched] = useState(false);
  const [isDisplayNameTouched, setIsDisplayNameTouched] = useState(false);
  const [isBiographyTouched, setIsBiographyTouched] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);
  const [isSoftwareProficiencyTouched, setIsSoftwareProficiencyTouched] =
    useState(false);
  const [isGenresTouched, setIsGenresTouched] = useState(false);
  const [isLanguagesTouched, setIsLanguagesTouched] = useState(false);

  // Validation functions
  const isFullNameValid =
    fullName.length >= MIN_FULL_NAME_LENGTH &&
    fullName.length <= MAX_FULL_NAME_LENGTH;
  const isBiographyValid =
    biography.length >= MIN_BIOGRAPHY_LENGTH &&
    biography.length <= MAX_BIOGRAPHY_LENGTH;
  const isLanguagesValid =
    languages.length > 0 && languages.length <= MAX_LANGUAGES;
  const isSkillsValid =
    skills.length >= MIN_SKILLS && skills.length <= MAX_SKILLS;
  const isGenresValid =
    genres.length >= MIN_GENRES && genres.length <= MAX_GENRES;
  const isSoftwareProficiencyValid =
    softwareProficiency.length > 0 &&
    softwareProficiency.length <= MAX_SOFTWARE_PROFICIENCY;

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
      !isDisplayNameValid ||
      !isBiographyValid ||
      !isLanguagesValid ||
      !isSkillsValid ||
      !isGenresValid ||
      !isSoftwareProficiencyValid
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
    formData.set("software_proficiency", JSON.stringify(softwareProficiency));
    formData.set("languages", JSON.stringify(languages));
    formData.set("skills", JSON.stringify(skills));
    formData.set("preferred_genres", JSON.stringify(genres));
    formData.set("availability", availability.toString());
    formData.set("full_name", fullName);
    formData.set("display_name", displayName.toLowerCase());
    formData.set("biography", biography);
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

  const renderSelectCount = (current: number, min: number, max: number) => {
    const isValid = current >= min && current <= max;
    const color = isValid ? "text-green-500" : "text-red-500";
    return (
      <p className={`text-sm ${color} mt-1 flex items-center`}>
        {isValid ? (
          <CheckCircle2 className="w-4 h-4 mr-1" />
        ) : (
          <AlertCircle className="w-4 h-4 mr-1" />
        )}
        {current}/{min}-{max} selected
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

              {/* Biography */}
              <div>
                <Label htmlFor="biography">About You</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Textarea
                        name="biography"
                        id="biography"
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        onBlur={() => setIsBiographyTouched(true)}
                        className={`mt-2 min-h-[100px] ${
                          isBiographyTouched && !isBiographyValid
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="Tell us about yourself, your experience, and what you do..."
                        required
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Your Description should be between 100 and 200
                        characters.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {renderCharacterCount(
                  biography.length,
                  MIN_BIOGRAPHY_LENGTH,
                  MAX_BIOGRAPHY_LENGTH,
                  isBiographyTouched
                )}
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="availability">Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others know if you're available for new projects
                  </p>
                </div>
                <Switch
                  id="availability"
                  checked={availability}
                  onCheckedChange={setAvailability}
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <div /> {/* Empty div for spacing */}
              <Button
                onClick={() => setStep(2)}
                disabled={
                  !isFullNameValid || !isDisplayNameValid || !isBiographyValid
                }
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <StepHeader
              title="Languages"
              description="What languages do you work with?"
            />

            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Select
                          value={selectedLanguage}
                          onValueChange={(value) => {
                            setSelectedLanguage(value);
                            setIsLanguagesTouched(true); // Mark as touched on change
                          }}
                          disabled={languages.length >= MAX_LANGUAGES}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            {languageOptions
                              .filter(
                                (lang) =>
                                  !languages.some(
                                    (l) =>
                                      l.language.toLowerCase() ===
                                      lang.toLowerCase()
                                  )
                              )
                              .map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Select up to {MAX_LANGUAGES} languages you are
                          proficient in.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    type="button"
                    variant="green_plus"
                    onClick={() => {
                      if (selectedLanguage) {
                        setLanguages([
                          ...languages,
                          {
                            language: selectedLanguage.toLowerCase(),
                            level: "beginner",
                          },
                        ]);
                        setSelectedLanguage("");
                        setIsLanguagesTouched(true); // Mark as touched on add
                      }
                    }}
                    disabled={
                      languages.length >= MAX_LANGUAGES || !selectedLanguage
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="mt-2">
                  {/* Show count feedback only after interaction */}
                  {isLanguagesTouched &&
                    renderSelectCount(languages.length, 1, MAX_LANGUAGES)}

                  {/* Show validation alert only after interaction */}
                  {isLanguagesTouched && languages.length === 0 && (
                    <p className="text-sm text-orange-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Please add at least one language.
                    </p>
                  )}
                </div>
              </div>
              {/* Selected Languages */}
              <div className="space-y-4">
                {languages.map((lang, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium capitalize">
                          {lang.language}
                        </h3>
                        <Button
                          type="button"
                          variant="red_plus"
                          size="icon"
                          onClick={() => {
                            setLanguages(
                              languages.filter(
                                (l) => l.language !== lang.language
                              )
                            );
                            setIsLanguagesTouched(true); // Mark as touched on remove
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Label className="mb-2 block text-muted-foreground">
                        Select Your Language Level:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {languageLevels.map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={
                              lang.level === level ? "yellow_plus" : "secondary"
                            }
                            onClick={() => {
                              setLanguages(
                                languages.map((l) =>
                                  l.language === lang.language
                                    ? { ...l, level }
                                    : l
                                )
                              );
                              setIsLanguagesTouched(true); // Mark as touched on change
                            }}
                            className="rounded-full"
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!isLanguagesValid}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <StepHeader
              title="Skills & Experience"
              description="Tell us about your expertise and preferred work"
            />

            {/* Skills Section */}
            <div className="space-y-2">
              <Label>Choose a Skill</Label>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select
                        value={selectedSkill}
                        onValueChange={(value) => {
                          setSelectedSkill(value);
                          setIsSkillsTouched(true); // Mark as touched on change
                        }}
                        disabled={skills.length >= MAX_SKILLS}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillOptions
                            .filter((skill) => !skills.includes(skill))
                            .map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Select between {MIN_SKILLS} and {MAX_SKILLS} skills.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  variant="green_plus"
                  onClick={() => {
                    if (selectedSkill) {
                      setSkills([...skills, selectedSkill]);
                      setSelectedSkill("");
                      setIsSkillsTouched(true); // Mark as touched on add
                    }
                  }}
                  disabled={skills.length >= MAX_SKILLS || !selectedSkill}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div>
                {/* Show count feedback only after interaction */}
                {isSkillsTouched &&
                  renderSelectCount(skills.length, MIN_SKILLS, MAX_SKILLS)}

                {/* Show validation alert only after interaction */}
                {isSkillsTouched && skills.length < MIN_SKILLS && (
                  <p className="text-sm text-orange-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please add at least {MIN_SKILLS} skills.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="warning"
                    className="flex items-center space-x-1 rounded-full"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="rounded-full flex justify-between gap-2 p-2"
                      onClick={() => {
                        setSkills(skills.filter((s) => s !== skill));
                        setIsSkillsTouched(true); // Mark as touched on remove
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Genres Section */}
            <div className="space-y-2">
              <Label>Choose a Style/Genre</Label>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select
                        value={selectedGenre}
                        onValueChange={(value) => {
                          setSelectedGenre(value);
                          setIsGenresTouched(true); // Mark as touched on change
                        }}
                        disabled={genres.length >= MAX_GENRES}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Style/Genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {genreOptions
                            .filter((genre) => !genres.includes(genre))
                            .map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Select between {MIN_GENRES} and {MAX_GENRES} genres.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  variant="green_plus"
                  onClick={() => {
                    if (selectedGenre) {
                      setGenres([...genres, selectedGenre]);
                      setSelectedGenre("");
                      setIsGenresTouched(true); // Mark as touched on add
                    }
                  }}
                  disabled={genres.length >= MAX_GENRES || !selectedGenre}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div>
                {/* Show count feedback only after interaction */}
                {isGenresTouched &&
                  renderSelectCount(genres.length, MIN_GENRES, MAX_GENRES)}

                {/* Show validation alert only after interaction */}
                {isGenresTouched && genres.length < MIN_GENRES && (
                  <p className="text-sm text-orange-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please add at least {MIN_GENRES} genres.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="cyan"
                    className="flex items-center space-x-1 rounded-full"
                  >
                    <span>{genre}</span>
                    <button
                      type="button"
                      className="rounded-full flex justify-between gap-2 p-2"
                      onClick={() => {
                        setGenres(genres.filter((g) => g !== genre));
                        setIsGenresTouched(true); // Mark as touched on remove
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Software Proficiency Section */}
            <div className="space-y-2">
              <Label>Choose Software and Years of Experience</Label>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select
                        value={selectedSoftware}
                        onValueChange={(value) => {
                          setSelectedSoftware(value);
                          setIsSoftwareProficiencyTouched(true); // Mark as touched on change
                        }}
                        disabled={
                          softwareProficiency.length >= MAX_SOFTWARE_PROFICIENCY
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select software" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoEditingSoftware
                            .filter(
                              (software) =>
                                !softwareProficiency.some(
                                  (item) => item.software === software
                                )
                            )
                            .map((software) => (
                              <SelectItem key={software} value={software}>
                                {software}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Select up to {MAX_SOFTWARE_PROFICIENCY} software tools.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  variant="green_plus"
                  onClick={() => {
                    if (selectedSoftware) {
                      setSoftwareProficiency([
                        ...softwareProficiency,
                        { software: selectedSoftware, yearsOfExperience: 1 },
                      ]);
                      setSelectedSoftware("");
                      setIsSoftwareProficiencyTouched(true); // Mark as touched on add
                    }
                  }}
                  disabled={
                    softwareProficiency.length >= MAX_SOFTWARE_PROFICIENCY ||
                    !selectedSoftware
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div>
                {/* Show count feedback only after interaction */}
                {isSoftwareProficiencyTouched &&
                  renderSelectCount(
                    softwareProficiency.length,
                    1,
                    MAX_SOFTWARE_PROFICIENCY
                  )}

                {/* Show validation alert only after interaction */}
                {isSoftwareProficiencyTouched &&
                  softwareProficiency.length === 0 && (
                    <p className="text-sm text-orange-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Please add at least one software tool.
                    </p>
                  )}
              </div>
              <div className="grid gap-4 mt-2">
                {softwareProficiency.map((item) => (
                  <Card key={item.software} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">{item.software}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSoftwareProficiency(
                            softwareProficiency.filter(
                              (s) => s.software !== item.software
                            )
                          );
                          setIsSoftwareProficiencyTouched(true); // Mark as touched on remove
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Label className="mb-2 block">Years of Experience</Label>
                    <Select
                      value={item.yearsOfExperience.toString()}
                      onValueChange={(value) => {
                        setSoftwareProficiency(
                          softwareProficiency.map((s) =>
                            s.software === item.software
                              ? { ...s, yearsOfExperience: parseInt(value, 10) }
                              : s
                          )
                        );
                        setIsSoftwareProficiencyTouched(true); // Mark as touched on change
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select years" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map(
                          (year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year} {year === 1 ? "year" : "years"}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Card>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  !isSkillsValid ||
                  !isGenresValid ||
                  !isSoftwareProficiencyValid ||
                  isLoading
                }
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
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
