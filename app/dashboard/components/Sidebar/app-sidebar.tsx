"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLinkStatus } from "next/link";
import Image from "next/image";
import {
  ArrowLeftStartOnRectangleIcon,
  FolderIcon,
  Cog6ToothIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { ActivityDropdown } from "./ActivityDropdown";
import { GlobalSearch } from "./GlobalSearch";

interface Portfolio {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  has_password: boolean | null;
  user_id: string;
  country: string | null;
  is_verified: boolean | null;
  account_status: string | null;
  created_at: string;
  account_type: string;
  timezone: string | null;
}

function LinkStatus({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  const pathname = usePathname();

  if (pathname === href) {
    return null;
  }

  return pending ? (
    <div className="flex flex-col items-center">
      <svg
        className="size-4 text-purple-600 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  ) : null;
}

function UserAvatar({
  portfolio,
  loading,
}: {
  portfolio: Portfolio | null;
  loading: boolean;
}) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="size-7 rounded-[5px] bg-muted animate-pulse flex items-center justify-center flex-shrink-0">
        <UserIcon className="size-4 text-muted-foreground" />
      </div>
    );
  }

  if (portfolio?.avatar_url) {
    return (
      <div className="size-6 rounded-[5px] overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
        <Image
          src={portfolio.avatar_url}
          alt={portfolio.display_name || portfolio.full_name || "User"}
          width={25}
          height={25}
          className="size-full rounded-[5px] object-cover"
          style={{ minWidth: "25px", minHeight: "25px" }}
        />
      </div>
    );
  }

  return (
    <div className="size-7 rounded-[5px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
      {getInitials(portfolio?.full_name)}
    </div>
  );
}

export function AppSidebar() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          setProfileLoading(false);
          return;
        }

        setUser(user);
        setLoading(false);

        const { data: portfolioData, error: portfolioError } = await supabase
          .from("editor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (portfolioError && portfolioError.code !== "PGRST116") {
          console.error("Error fetching portfolio:", portfolioError);
        } else {
          setPortfolio(portfolioData);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchUserData();
  }, []);

  const isActiveSection = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  if (loading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b p-0 m-0 bg-background">
          <div className="flex items-center py-0 m-0 gap-2 group-data-[collapsible=icon]:px-2 px-3 h-[49px] relative">
            <Link href="/" className="flex items-center gap-2">
              <Image
                width={30}
                height={30}
                src={"/MainLogo.png"}
                alt={"Raivcoo Logo"}
              />
            </Link>
            <h1 className="group-data-[collapsible=icon]:hidden">Raivcoo</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Loading skeleton buttons */}
                {[1, 2, 3, 4].map((i) => (
                  <SidebarMenuItem key={i}>
                    <div className="h-10 bg-muted animate-pulse rounded-md mx-2 mb-2" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-0 m-0 bg-background">
        <div className="flex items-center py-0 m-0 gap-2 group-data-[collapsible=icon]:px-2 px-3 h-[49px] relative">
          <Link href="/" className="flex items-center gap-2">
            <Image
              width={30}
              height={30}
              src={"/MainLogo.png"}
              alt={"Raivcoo Logo"}
            />
          </Link>
          <h1 className="group-data-[collapsible=icon]:hidden">Raivcoo</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-[-15px]">
        {/* User Profile Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="text-xs mb-2 mt-1 font-medium text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">
              Profile
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard/profile" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center gap-3 h-12",
                      isActiveSection("/dashboard/profile") && "bg-muted"
                    )}
                  >
                    <UserAvatar
                      portfolio={portfolio}
                      loading={profileLoading}
                    />
                    <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {profileLoading ? (
                          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        ) : (
                          portfolio?.display_name ||
                          portfolio?.full_name ||
                          "User"
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profileLoading ? (
                          <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
                        ) : (
                          portfolio?.email || user.email
                        )}
                      </span>
                    </div>
                    <div className="group-data-[collapsible=icon]:hidden">
                      <LinkStatus href="/dashboard/profile" />
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="text-xs mb-2 mt-1 font-medium text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">
              Projects
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center",
                      isActiveSection("/dashboard") && "bg-muted"
                    )}
                  >
                    <div>
                      <FolderIcon
                        strokeWidth={1.5}
                        className={`size-6 ${isActiveSection("/dashboard") ? "text-[#0070F3]" : ""}`}
                      />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Main
                    </span>
                    <div className="group-data-[collapsible=icon]:hidden">
                      <LinkStatus href="/dashboard" />
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="text-xs mb-2 mt-1 font-medium text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">
              Menu
            </div>
            <SidebarMenu>
              {/* Search */}
              <SidebarMenuItem>
                <div className="w-full px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  <GlobalSearch
                    compact={true}
                    onMediaSelect={(media) => {
                      // Handle media selection - navigate to project and select media
                      if (media.projectId) {
                        window.location.href = `/dashboard/projects/${media.projectId}?media=${media.id}`;
                      }
                    }}
                  />
                  <span className="ml-2 group-data-[collapsible=icon]:hidden text-sm">
                    Search
                  </span>
                </div>
              </SidebarMenuItem>
              {/* Activity Dropdown */}
              <SidebarMenuItem>
                <ActivityDropdown />
              </SidebarMenuItem>

              {/* Settings */}
              <SidebarMenuItem>
                <Link href="/dashboard/settings" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center",
                      isActiveSection("/dashboard/settings") && "bg-muted"
                    )}
                  >
                    <div>
                      <Cog6ToothIcon
                        strokeWidth={1.5}
                        className={`size-6 ${isActiveSection("/dashboard/settings") ? "text-[#0070F3]" : ""}`}
                      />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Settings
                    </span>
                    <div className="group-data-[collapsible=icon]:hidden">
                      <LinkStatus href="/dashboard/settings" />
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              {/* Sign Out */}
              <SidebarMenuItem>
                <form action="/auth/signout" method="post" className="w-full">
                  <SidebarMenuButton
                    type="submit"
                    className="flex items-center w-full group-data-[collapsible=icon]:justify-center cursor-pointer text-red-500 hover:text-red-600"
                  >
                    <div>
                      <ArrowLeftStartOnRectangleIcon
                        strokeWidth={1.5}
                        className="size-6"
                      />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Sign out
                    </span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
