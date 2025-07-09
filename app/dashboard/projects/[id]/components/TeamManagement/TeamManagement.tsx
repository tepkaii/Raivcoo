// app/dashboard/projects/[id]/components/TeamManagement.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Crown, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  EyeIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { createClient } from "@/utils/supabase/client";
import { getSubscriptionInfo } from "@/app/dashboard/lib/actions";

type ProjectRole = "viewer" | "reviewer" | "collaborator";

interface ProjectMember {
  id: string;
  user_id: string;
  role: ProjectRole;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  joined_at?: string;
  user_profile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

interface EditorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface TeamManagementProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  onMembersUpdate: (newMembers: ProjectMember[]) => void;
}

interface MemberPermissions {
  canInvite: boolean;
  maxMembers: number;
  planName: string;
  isActive: boolean;
  currentCount: number;
  suggestions: {
    invite?: string;
  };
}

const roleLabels = {
  viewer: "Viewer",
  reviewer: "Reviewer",
  collaborator: "Collaborator",
};

const roleDescriptions = {
  viewer: "Can only view content",
  reviewer: "Can comment and change status",
  collaborator: "Full access except member management",
};

// Autocomplete Input Component
interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (profile: EditorProfile) => void;
  placeholder?: string;
  disabled?: boolean;
  currentUserId: string;
  existingMemberEmails: string[];
}

function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
  currentUserId,
  existingMemberEmails,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<EditorProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const supabase = createClient();

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("editor_profiles")
        .select("id, user_id, full_name, display_name, email, avatar_url")
        .neq("user_id", currentUserId)
        .eq("account_status", "active")
        .or(
          `full_name.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(10);

      if (error) {
        console.error("Error searching editor profiles:", error);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const filteredProfiles = (profiles || []).filter(
        (profile) => !existingMemberEmails.includes(profile.email.toLowerCase())
      );

      setSuggestions(filteredProfiles);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (profile: EditorProfile) => {
    onSelect(profile);
    onChange(profile.email);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getDisplayName = (profile: EditorProfile) => {
    return profile.display_name || profile.full_name || profile.email;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pr-8"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((profile, index) => (
            <div
              key={profile.id}
              className={`px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${
                index === highlightedIndex ? "bg-accent" : ""
              }`}
              onClick={() => handleSelect(profile)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={getDisplayName(profile)}
                      className="w-8 h-8 rounded-[5px] object-cover border border-primary"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {getDisplayName(profile).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {getDisplayName(profile)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {profile.email}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        value.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3">
            <div className="text-sm text-muted-foreground text-center">
              No editors found matching "{value}"
            </div>
          </div>
        )}
    </div>
  );
}

// Role Selector Component
interface RoleSelectorProps {
  value: ProjectRole;
  onValueChange: (value: ProjectRole) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

function RoleSelector({
  value,
  onValueChange,
  disabled,
  showDescription = false,
}: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4 text-blue-500" />
              <span>Viewer</span>
            </div>
          </SelectItem>
          <SelectItem value="reviewer">
            <div className="flex items-center gap-2">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-green-500" />
              <span>Reviewer</span>
            </div>
          </SelectItem>
          <SelectItem value="collaborator">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-purple-500" />
              <span>Collaborator</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {showDescription && (
        <div className="text-muted-foreground py-2">
          {roleDescriptions[value]}
        </div>
      )}
    </div>
  );
}

export function TeamManagement({
  projectId,
  members,
  isOwner,
  onMembersUpdate,
}: TeamManagementProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<EditorProfile | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [localMembers, setLocalMembers] = useState<ProjectMember[]>(members);
  const [permissions, setPermissions] = useState<MemberPermissions | null>(
    null
  );
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const supabase = createClient();

  // Sync local members with props
  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, [supabase]);

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoadingPermissions(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const subscriptionInfo = await getSubscriptionInfo(user.id);

      const hasActiveSubscription =
        subscriptionInfo.hasPaidPlan &&
        subscriptionInfo.isActive &&
        !subscriptionInfo.isExpired;

      // Count ALL members (pending + accepted) - NO +1 for owner
      const currentCount = localMembers.filter(
        (m) => m.status !== "declined"
      ).length;

      let perms: MemberPermissions;

      if (hasActiveSubscription) {
        perms = {
          canInvite: true,
          maxMembers: Infinity,
          planName: subscriptionInfo.planName,
          isActive: true,
          currentCount,
          suggestions: {},
        };
      } else {
        // Free plan: 2 members per project
        perms = {
          canInvite: currentCount < 2,
          maxMembers: 2,
          planName: "Free",
          isActive: false,
          currentCount,
          suggestions: {
            invite: "Upgrade to Lite or Pro for unlimited team members",
          },
        };
      }

      setPermissions(perms);
    } catch (error) {
      console.error("Failed to load permissions:", error);

      setPermissions({
        canInvite: false,
        maxMembers: 2,
        planName: "Free",
        isActive: false,
        currentCount: localMembers.filter((m) => m.status !== "declined")
          .length, // NO +1 here either
        suggestions: {
          invite:
            "Could not verify subscription. Team member limits apply on Free plan.",
        },
      });

      toast({
        title: "Warning",
        description:
          "Could not load team permissions. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [supabase, localMembers]);

  useEffect(() => {
    loadPermissions();
  }, [localMembers]);

  // Get existing member emails for filtering
  const existingMemberEmails = localMembers
    .map((member) => member.user_profile?.email?.toLowerCase() || "")
    .filter(Boolean);

  // Fetch updated members from database
  const fetchUpdatedMembers = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select(
          `
          project_members (
            id,
            user_id,
            role,
            status,
            invited_at,
            joined_at
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching updated members:", error);
        return;
      }

      // Get user profiles for all members
      const memberUserIds =
        projectData.project_members?.map((m) => m.user_id) || [];
      const { data: userProfiles } = await supabase
        .from("editor_profiles")
        .select("user_id, full_name, display_name, email, avatar_url")
        .in("user_id", memberUserIds);

      // Combine member data with user profiles
      const membersWithProfiles: ProjectMember[] =
        projectData.project_members?.map((member) => {
          const profile = userProfiles?.find(
            (p) => p.user_id === member.user_id
          );
          return {
            ...member,
            user_profile: profile
              ? {
                  email: profile.email || "",
                  name:
                    profile.display_name ||
                    profile.full_name ||
                    profile.email ||
                    "Unknown",
                  avatar_url: profile.avatar_url || undefined,
                }
              : undefined,
          };
        }) || [];

      setLocalMembers(membersWithProfiles);
      onMembersUpdate(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching updated members:", error);
    }
  };

  const handleProfileSelect = (profile: EditorProfile) => {
    setSelectedProfile(profile);
    setInviteEmail(profile.email);
  };

  const handleEmailChange = (email: string) => {
    setInviteEmail(email);
    if (selectedProfile && email !== selectedProfile.email) {
      setSelectedProfile(null);
    }
  };

  const clearInviteForm = () => {
    setInviteEmail("");
    setInviteRole("viewer");
    setSelectedProfile(null);
    setShowInviteForm(false);
  };

  const handleInvite = async () => {
    if (!permissions?.canInvite) {
      toast({
        title: "Team Member Limit Reached",
        description:
          permissions?.suggestions.invite || "Upgrade to invite more members",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const existingMember = localMembers.find(
      (member) =>
        member.user_profile?.email?.toLowerCase() ===
        inviteEmail.trim().toLowerCase()
    );

    if (existingMember) {
      toast({
        title: "Already a Member",
        description: "This person is already part of the project",
        variant: "outline",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation sent",
          description: selectedProfile
            ? `Invited ${selectedProfile.display_name || selectedProfile.full_name || selectedProfile.email} as ${roleLabels[inviteRole]}`
            : `Invited ${inviteEmail} as ${roleLabels[inviteRole]}`,
          variant: "green",
        });

        clearInviteForm();
        await fetchUpdatedMembers();
        await loadPermissions(); // Refresh permissions
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Role updated",
          description: `Member role changed to ${roleLabels[newRole]}`,
          variant: "green",
        });

        // Update local state immediately for smooth UX
        setLocalMembers((prev) =>
          prev.map((member) =>
            member.id === memberId ? { ...member, role: newRole } : member
          )
        );

        // Also update parent component
        const updatedMembers = localMembers.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        );
        onMembersUpdate(updatedMembers);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Member removed",
          description: "Member has been removed from the project",
          variant: "green",
        });

        // Update local state immediately for smooth UX
        setLocalMembers((prev) =>
          prev.filter((member) => member.id !== memberId)
        );

        // Also update parent component
        const updatedMembers = localMembers.filter(
          (member) => member.id !== memberId
        );
        onMembersUpdate(updatedMembers);
        await loadPermissions(); // Refresh permissions
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleInviteClick = () => {
    if (!permissions?.canInvite) {
      toast({
        title: "Team Member Limit Reached",
        description:
          permissions?.suggestions.invite || "Upgrade to invite more members",
        variant: "destructive",
      });
      return;
    }
    setShowInviteForm(!showInviteForm);
  };

  // Show loading state while permissions are being fetched
  if (isLoadingPermissions) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Team Members</h3>
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium">Team Members</h3>
          {permissions && (
            <Badge
              variant={permissions.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {permissions.planName}
            </Badge>
          )}
          {permissions && !permissions.isActive && (
            <div className="text-xs text-muted-foreground">
              {permissions.currentCount}/{permissions.maxMembers} members
            </div>
          )}
        </div>
        {isOwner && (
          <Button
            size="sm"
            className="gap-2"
            variant={showInviteForm ? "outline" : "default"}
            onClick={handleInviteClick}
            disabled={!permissions?.canInvite}
          >
            <UserPlusIcon className="h-4 w-4" />
            {showInviteForm ? "Cancel" : "Invite"}
            {!permissions?.canInvite && <LockClosedIcon className="h-3 w-3" />}
          </Button>
        )}
      </div>

      {/* Member limit warning for Free plan */}
      {permissions && !permissions.isActive && !permissions.canInvite && (
        <div className="p-3  border  rounded-lg">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-orange-500" />
            <div className="text-sm">
              <p className="font-medium">Free Plan Limit Reached</p>
              <p className="text-muted-foreground">
                {permissions.suggestions.invite}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && isOwner && permissions?.canInvite && (
        <div className="p-4 border rounded-lg bg-muted/35 space-y-4">
          <h4 className="font-medium">Invite Team Member</h4>

          <div>
            <label className="text-sm font-medium block mb-2">
              Search for team member
            </label>
            <AutocompleteInput
              value={inviteEmail}
              onChange={handleEmailChange}
              onSelect={handleProfileSelect}
              placeholder="Type name or email to search..."
              disabled={isLoading}
              currentUserId={currentUserId}
              existingMemberEmails={existingMemberEmails}
            />
            {selectedProfile && (
              <div className="mt-2 p-2 bg-input/30 rounded border flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-[5px] flex items-center justify-center">
                  {selectedProfile.avatar_url ? (
                    <img
                      src={selectedProfile.avatar_url}
                      alt={
                        `${selectedProfile.full_name} avatar` || "User avatar"
                      }
                      className="w-8 h-8 rounded-[5px] object-cover border border-primary"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {(
                        selectedProfile.display_name ||
                        selectedProfile.full_name ||
                        selectedProfile.email
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {selectedProfile.display_name ||
                      selectedProfile.full_name ||
                      selectedProfile.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedProfile.email}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProfile(null);
                    setInviteEmail("");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Role</label>
            <RoleSelector
              value={inviteRole}
              onValueChange={setInviteRole}
              disabled={isLoading}
              showDescription={true}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={clearInviteForm}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isLoading || !inviteEmail.trim()}
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {localMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 border bg-primary-foreground rounded-[5px]"
          >
            <div className="flex items-center gap-3">
              <div>
                {member.user_profile?.avatar_url ? (
                  <img
                    src={member.user_profile.avatar_url}
                    alt={member.user_profile.name}
                    className="w-8 h-8 rounded-[5px] border border-primary object-cover"
                  />
                ) : (
                  <div className="text-sm font-medium border bg-muted flex rounded-[5px] items-center justify-center w-8 h-8 border-primary">
                    {member.user_profile?.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">
                  {member.user_profile?.name || "Unknown"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.user_profile?.email}
                </div>
                {member.status === "pending" && (
                  <div className="text-xs text-amber-600">
                    Invitation pending
                  </div>
                )}
                {member.status === "declined" && (
                  <div className="text-xs text-red-600">
                    Invitation declined
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <div className="flex items-center gap-1">
                  {member.status === "accepted" && (
                    <Select
                      value={member.role}
                      onValueChange={(value: ProjectRole) =>
                        handleRoleChange(member.id, value)
                      }
                    >
                      <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <EyeIcon className="h-4 w-4 text-blue-500" />
                            <span>Viewer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reviewer">
                          <div className="flex items-center gap-2">
                            <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-green-500" />
                            <span>Reviewer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="collaborator">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-purple-500" />
                            <span>Collaborator</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {member.status === "declined" && (
                    <span className="text-sm text-muted-foreground px-3 py-1.5 border rounded-md">
                      Declined
                    </span>
                  )}

                  {member.status === "pending" && (
                    <span className="text-sm text-muted-foreground px-3 py-1.5 border rounded-full">
                      Pending
                    </span>
                  )}

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {localMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No team members yet</p>
            <p className="text-sm">
              {permissions?.canInvite
                ? "Invite collaborators to work on this project"
                : "Upgrade to invite more team members"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}