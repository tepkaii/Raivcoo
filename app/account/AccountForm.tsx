//ProfileForm.tsx file

"use client";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  languageOptions,
  skillOptions,
  genreOptions,
  languageLevels,
  countries,
  videoEditingSoftware,
} from "../../utils/ProfileOptions";
import { validateDisplayName } from "./displayNameValidation";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface Language {
  language: string;
  level: string;
}

interface AccountData {
  email: string | number | readonly string[] | undefined;
  availability: boolean;
  user_id: string;
  full_name: string;
  display_name: string;
  country: string;
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
interface AccountFormProps {
  Account: AccountData;
  updateAccount: (formData: FormData) => Promise<{ message: string }>;
}
interface LevelSelectorProps {
  options: string[];
  value: string;
  onChange: (option: string) => void;
}
const MIN_FULL_NAME_LENGTH = 5;
const MAX_FULL_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 20;
const MAX_LANGUAGES = 5;
//
const MIN_SKILLS = 3;
const MAX_SKILLS = 5;
const MIN_GENRES = 3;
const MAX_GENRES = 5;

//

const MAX_SOFTWARE_PROFICIENCY = 5;
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
  const [languages, setLanguages] = useState<Language[]>(
    Account.languages || []
  );
  const [softwareProficiency, setSoftwareProficiency] = useState<
    SoftwareProficiency[]
  >(
    Array.isArray(Account.software_proficiency)
      ? Account.software_proficiency
      : []
  );

  const [skills, setSkills] = useState<string[]>(Account.skills || []);
  const [genres, setGenres] = useState<string[]>(
    Account.preferred_genres || []
  );
  const [fullName, setFullName] = useState(Account.full_name);
  const [displayName, setDisplayName] = useState(Account.display_name);

  //
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedSoftware, setSelectedSoftware] = useState<string>("");
  //
  const [availability, setAvailability] = useState(
    Account.availability || false
  );
  const [country, setCountry] = useState(Account.country);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);
  const isSoftwareProficiencyValid =
    softwareProficiency.length > 0 &&
    softwareProficiency.length <= MAX_SOFTWARE_PROFICIENCY;

  // isFullNameValid
  const isFullNameValid =
    fullName.length >= MIN_FULL_NAME_LENGTH &&
    fullName.length <= MAX_FULL_NAME_LENGTH;

  // isLanguagesValid
  const isLanguagesValid =
    languages.length > 0 && languages.length <= MAX_LANGUAGES;

  // isSkillsValid && isGenresValid
  const isSkillsValid =
    skills.length >= MIN_SKILLS && skills.length <= MAX_SKILLS;
  const isGenresValid =
    genres.length >= MIN_GENRES && genres.length <= MAX_GENRES;
  //

  // isFormValid
  const isFormValid =
    isFullNameValid &&
    isDisplayNameValid &&
    isLanguagesValid &&
    isSkillsValid &&
    isGenresValid &&
    isSoftwareProficiencyValid;

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

  const handleRemoveSoftwareProficiency = (software: string) => {
    setSoftwareProficiency(
      softwareProficiency.filter((s) => s.software !== software)
    );
  };
  const handleUpdateYearsOfExperience = (software: string, years: number) => {
    setSoftwareProficiency(
      softwareProficiency.map((item) =>
        item.software === software
          ? { ...item, yearsOfExperience: years }
          : item
      )
    );
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
      formData.set("software_proficiency", JSON.stringify(softwareProficiency));
      formData.set("languages", JSON.stringify(languages));
      formData.set("skills", JSON.stringify(skills));
      formData.set("preferred_genres", JSON.stringify(genres));
      formData.set("availability", availability.toString());
      formData.set("full_name", fullName);
      formData.set("display_name", displayName.toLowerCase()); // Ensure lowercase when saving
      formData.set("country", country);

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

  const handleAddLanguage = (lang: string) => {
    if (
      lang &&
      languages.length < MAX_LANGUAGES &&
      !languages.some((l) => l.language.toLowerCase() === lang.toLowerCase())
    ) {
      setLanguages([
        ...languages,
        { language: lang.toLowerCase(), level: "beginner" },
      ]);
      setSelectedLanguage("");
    } else if (languages.length >= MAX_LANGUAGES) {
      toast({
        title: "Limit Reached",
        description: `You can only add up to ${MAX_LANGUAGES} languages.`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l.language !== lang.toLowerCase()));
  };

  const handleLanguageLevelChange = (lang: string, level: string) => {
    setLanguages(
      languages.map((l) =>
        l.language.toLowerCase() === lang.toLowerCase() ? { ...l, level } : l
      )
    );
  };

  const handleAddItem = (
    category: "skills" | "preferred_genres",
    item: string
  ) => {
    if (!item) return; // Prevent adding empty items

    if (
      category === "skills" &&
      skills.length < MAX_SKILLS &&
      !skills.includes(item)
    ) {
      setSkills([...skills, item]);
      setSelectedSkill(""); // Reset selected skill
    } else if (
      category === "preferred_genres" &&
      genres.length < MAX_GENRES &&
      !genres.includes(item)
    ) {
      setGenres([...genres, item]);
      setSelectedGenre(""); // Reset selected genre
    } else {
      const limit = category === "skills" ? MAX_SKILLS : MAX_GENRES;
      toast({
        title: "Limit Reached",
        description: `You can only add up to ${limit} ${category}.`,
        variant: "default",
      });
    }
  };

  const handleRemoveItem = (
    category: "skills" | "preferred_genres",
    item: string
  ) => {
    if (category === "skills") {
      setSkills(skills.filter((s) => s !== item));
    } else if (category === "preferred_genres") {
      setGenres(genres.filter((g) => g !== item));
    }
  };
  const handleAddSoftwareProficiency = (software: string) => {
    if (!software) return; // Prevent adding empty software

    if (
      softwareProficiency.length < MAX_SOFTWARE_PROFICIENCY &&
      !softwareProficiency.some((item) => item.software === software)
    ) {
      setSoftwareProficiency([
        ...softwareProficiency,
        { software, yearsOfExperience: 1 }, // Set default to 1 year
      ]);
    } else if (softwareProficiency.length >= MAX_SOFTWARE_PROFICIENCY) {
      toast({
        title: "Limit Reached",
        description: `You can only add up to ${MAX_SOFTWARE_PROFICIENCY} software proficiencies.`,
        variant: "destructive",
      });
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

  const renderSelectCount = (current: number, min: number, max: number) => {
    let color;
    const message = current === 1 ? "selected" : "selected";

    if (current === 0) {
      color = "text-gray-500";
    } else if (current >= min && current <= max) {
      color = "text-green-500";
    } else {
      color = "text-red-500";
    }

    return (
      <p className={`text-sm ${color} mt-1 flex items-center`}>
        {current >= min && current <= max ? (
          <CheckCircle2 className="w-4  mr-1" />
        ) : (
          <AlertCircle className="w-4  mr-1" />
        )}
        {current}/{min}-{max} {message}
      </p>
    );
  };

  //
  const LevelSelector: React.FC<LevelSelectorProps> = ({
    options,
    value,
    onChange,
  }) => {
    return (
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <RevButtons
            className="rounded-full"
            key={option}
            variant={value === option ? "warning" : "outline"}
            onClick={() => onChange(option)}
          >
            {option}
          </RevButtons>
        ))}
      </div>
    );
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-primary-foreground  mx-auto  min-h-screen"
    >
      <Card className="border-0 ">
        <CardContent className="py-28">
          <Tabs defaultValue="basic" className="w-full ">
            <TabsList className="grid w-full grid-cols-3 ">
              <TabsTrigger value="basic">About Me</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent
              value="basic"
              className="space-y-4 mt-6 border p-3 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg sm:p-6 border gap-4 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full sm:w-auto">
                  {/* Avatar Section */}
                  <div
                    className={`relative group cursor-pointer rounded-full  `}
                    onClick={() =>
                      document.getElementById("avatar-upload")?.click()
                    }
                  >
                    <div className="relative">
                      <Avatar className="h-24 w-24 sm:h-20 sm:w-20 rounded-lg border-2">
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
                  <div className="flex flex-col items-center mt-0 sm:mt-4 sm:items-start text-center sm:text-left">
                    <h2 className="sm:text-xl text-2xl font-semibold">
                      {Account.full_name}
                    </h2>
                    <p className="sm:text-sm text-base text-muted-foreground mt-1">
                      @{Account.display_name}
                    </p>
                  </div>
                </div>

                {/* Availability Switch */}
                <div className="flex items-center justify-center sm:justify-end border rounded-[10px] p-2 px-4  sm:w-auto">
                  <Switch
                    id="availability"
                    checked={availability}
                    onCheckedChange={setAvailability}
                  />
                  <Label
                    htmlFor="availability"
                    className="text-sm font-medium whitespace-nowrap ml-2"
                  >
                    {availability ? "Available for hire" : "Not available"}
                  </Label>
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
                    !isFullNameValid && fullName.length > 0
                      ? "border-red-500"
                      : ""
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
                      className={` ${
                        !isDisplayNameValid ? "border-red-500" : ""
                      }`}
                      placeholder="Choose your display name"
                      required
                      autoCapitalize="none" // Helps on mobile devices
                      style={{ textTransform: "lowercase" }} // Forces visual lowercase
                    />
                  </div>
                  <p className="text-sm text-muted-foreground ">
                    Your Portfolio URL will be:{" "}
                    <span className="font-mono bg-muted  px-2 py-0.5 rounded-full">
                      {displayName ? displayName.toLowerCase() : "username"}
                      .raivcoo.com
                    </span>
                  </p>
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

              <p className="text-sm text-muted-foreground flex flex-wrap gap-1">
                To Delete your account or Update your email, please contact us
                at{" "}
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
            </TabsContent>
            <TabsContent
              value="languages"
              className="space-y-4  mt-6 border p-3 rounded-lg"
            >
              <div>
                <Label>Languages (1-{MAX_LANGUAGES})</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Select
                    value={selectedLanguage}
                    onValueChange={(value) => setSelectedLanguage(value)}
                    disabled={languages.length >= MAX_LANGUAGES}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions
                        .filter(
                          (lang) =>
                            !languages.some(
                              (l) =>
                                l.language.toLowerCase() === lang.toLowerCase()
                            )
                        )
                        .map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <RevButtons
                    type="button"
                    variant={"success"}
                    onClick={() => {
                      if (selectedLanguage) {
                        handleAddLanguage(selectedLanguage);
                        setSelectedLanguage("");
                      }
                    }}
                    disabled={
                      languages.length >= MAX_LANGUAGES || !selectedLanguage
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </RevButtons>
                </div>
                {renderSelectCount(languages.length, 1, MAX_LANGUAGES)}
              </div>
              {languages.map((lang, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-1 ">
                      <h3 className="font-medium capitalize">
                        {lang.language}
                      </h3>
                      <RevButtons
                        className="rounded-full"
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLanguage(lang.language)}
                      >
                        <X className="h-4 w-4" />
                      </RevButtons>
                    </div>
                    <Label className="mb-2 block text-muted-foreground">
                      {" "}
                      Select Your Language Level:
                    </Label>
                    <LevelSelector
                      options={languageLevels}
                      value={lang.level}
                      onChange={(value) =>
                        handleLanguageLevelChange(lang.language, value)
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent
              value="skills"
              className="space-y-4  mt-6 border p-3 rounded-lg"
            >
              <div>
                <Label>Choose a Skill</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Select
                    value={selectedSkill}
                    onValueChange={(value) => setSelectedSkill(value)}
                    disabled={skills.length >= MAX_SKILLS}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
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
                  <RevButtons
                    type="button"
                    variant={"success"}
                    onClick={() => handleAddItem("skills", selectedSkill)}
                    disabled={skills.length >= MAX_SKILLS || !selectedSkill}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </RevButtons>
                </div>
                {renderSelectCount(skills.length, MIN_SKILLS, MAX_SKILLS)}
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="warning"
                      className="flex items-center space-x-1 rounded-full"
                    >
                      <span>{skill}</span>
                      <button
                        className="rounded-full flex justify-between gap-2 p-2"
                        type="button"
                        aria-label="Remove skill"
                        onClick={() => handleRemoveItem("skills", skill)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Choose a Style/Genre</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Select
                    value={selectedGenre}
                    onValueChange={(value) => setSelectedGenre(value)}
                    disabled={genres.length >= MAX_GENRES}
                  >
                    <SelectTrigger>
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
                  <RevButtons
                    variant={"success"}
                    type="button"
                    onClick={() =>
                      handleAddItem("preferred_genres", selectedGenre)
                    }
                    disabled={genres.length >= MAX_GENRES || !selectedGenre}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </RevButtons>
                </div>
                {renderSelectCount(genres.length, MIN_GENRES, MAX_GENRES)}
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
                        onClick={() =>
                          handleRemoveItem("preferred_genres", genre)
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Choose Software and Years of Experience</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Select
                    value={selectedSoftware}
                    onValueChange={setSelectedSoftware}
                    disabled={
                      softwareProficiency.length >= MAX_SOFTWARE_PROFICIENCY
                    }
                  >
                    <SelectTrigger>
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
                  <RevButtons
                    variant={"success"}
                    type="button"
                    onClick={() => {
                      if (selectedSoftware) {
                        handleAddSoftwareProficiency(selectedSoftware);
                        setSelectedSoftware("");
                      }
                    }}
                    disabled={
                      softwareProficiency.length >= MAX_SOFTWARE_PROFICIENCY ||
                      !selectedSoftware
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </RevButtons>
                </div>
                {renderSelectCount(
                  softwareProficiency.length,
                  1,
                  MAX_SOFTWARE_PROFICIENCY
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {softwareProficiency.map((item) => (
                    <Card key={item.software} className="p-4  w-full ">
                      <div className="flex flex-1 items-center justify-between mb-4">
                        <span className="font-medium">{item.software}</span>
                        <RevButtons
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveSoftwareProficiency(item.software)
                          }
                        >
                          <X className="h-4 w-4" />
                        </RevButtons>
                      </div>
                      <Label className="mb-2 block">Years of Experience</Label>
                      <Select
                        value={item.yearsOfExperience.toString()}
                        onValueChange={(value) =>
                          handleUpdateYearsOfExperience(
                            item.software,
                            parseInt(value, 10)
                          )
                        }
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
            </TabsContent>
          </Tabs>
          <div className="py-6">
        <RevButtons
          variant={"success"} className=""
          type="submit"
          disabled={
            isLoading ||
            !isFormValid ||
            isPending ||
            fullName.length > MAX_FULL_NAME_LENGTH ||
            displayName.length > MAX_DISPLAY_NAME_LENGTH ||
            languages.length > MAX_LANGUAGES ||
            skills.length > MAX_SKILLS ||
            genres.length > MAX_GENRES ||
            softwareProficiency.length > MAX_SOFTWARE_PROFICIENCY
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
