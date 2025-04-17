// components/app-sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Home,
  Users2,
  ChevronDown,
  LogOut,
  User,
  FolderOpenDot,
  SquareUser,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RevButtons } from "@/components/ui/RevButtons";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { EditorProfile } from "@/app/types/editorProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLinkStatus } from "next/link";

interface ProfileShowProps {
  portfolio: EditorProfile;
}

function LinkStatus({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  const pathname = usePathname();

  // Only skip the loading indicator if we're on the exact same path
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

export function AppSidebar({ portfolio: initialPortfolio }: ProfileShowProps) {
  const pathname = usePathname();

  // Check if we're in a specific section (more precise than just startsWith)
  const isActiveSection = (path: string) => {
    // For main dashboard, only highlight when exactly on dashboard
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    // For other sections, match if we're on that exact path or any nested path
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-0 m-0 border-[#3F3F3F] bg-background">
        <div className="flex items-center py-0 m-0 gap-2 group-data-[collapsible=icon]:px-2 px-3  h-[49px]">
          <Avatar className="h-8 w-8 rounded-lg  border-2">
            <AvatarImage
              src={initialPortfolio?.avatar_url || ""}
              alt={initialPortfolio?.display_name || "User"}
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium truncate">
              {initialPortfolio?.display_name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {initialPortfolio?.email || "user@example.com"}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction className="right-4 mt-2 flex justify-center items-center opacity-100 sm:opacity-100">
                <ChevronDown className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center ">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <form action="/auth/signout" method="post" className="w-full">
                  <div className="w-full">
                    <RevButtons
                      type="submit"
                      variant="destructive"
                      className="w-full text-left flex items-center"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </RevButtons>
                  </div>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-[-15px]">
        {/* 🟡 MAIN */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="text-xs mb-2 mt-1 font-medium text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">
              Dashboard
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center ",
                      isActiveSection("/dashboard") && "bg-muted"
                    )}
                  >
                    <div className="w-8 h-8 flex items-center justify-center border-2 rounded-md bg-[#783F04]/40 text-[#F59E0B] shrink-0">
                      <LayoutDashboard className="size-4" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Main
                    </span>
                    <LinkStatus href="/dashboard" />
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 🔵 CLIENTS */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard/clients" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center  ",
                      isActiveSection("/dashboard/clients") && "bg-muted"
                    )}
                  >
                    <div className="w-8 h-8 flex items-center justify-center border-2 rounded-md bg-[#1E3A8A]/40 text-[#3B82F6] shrink-0">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Clients
                    </span>
                    <LinkStatus href="/dashboard/clients" />
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 🟢 PROJECTS */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard/projects" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center ",
                      isActiveSection("/dashboard/projects") && "bg-muted"
                    )}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-md border-2 bg-[#064E3B]/40 text-[#10B981] shrink-0">
                      <FolderOpenDot className="w-4 h-4" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Projects
                    </span>
                    <LinkStatus href="/dashboard/projects" />
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 🟣 ACCOUNT */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard/account" className="w-full">
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center w-full group-data-[collapsible=icon]:justify-center ",
                      isActiveSection("/dashboard/account") && "bg-muted"
                    )}
                  >
                    <div className="w-8 h-8 flex items-center justify-center border-2 rounded-md bg-[#4C1D95]/40 text-[#A855F7] shrink-0">
                      <SquareUser className="w-4 h-4" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">
                      Account
                    </span>
                    <LinkStatus href="/dashboard/account" />
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}