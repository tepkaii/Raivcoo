// components/app-sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  User2,
  LogOut,
  User,
  FolderPlus,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RevButtons } from "@/components/ui/RevButtons";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { EditorProfile } from "@/app/types/editorProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileShowProps {
  portfolio: EditorProfile;
}

export function AppSidebar({ portfolio: initialPortfolio }: ProfileShowProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-0 m-0 border-[#3F3F3F] bg-primary-foreground">
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
                <Link href="/" className="flex items-center">
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

      <SidebarContent className="space-y-[-20px]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users2 />
                  <span>Main</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard"
                      isActive={pathname === "/dashboard"}
                    >
                      Main
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users2 />
                  <span>Clients</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/clients"
                      isActive={pathname === "/dashboard/clients"}
                    >
                      All Clients
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/clients/new"
                      isActive={pathname === "/dashboard/clients/new"}
                    >
                      New Client
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home />
                  <span>Projects</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/projects"
                      isActive={pathname === "/dashboard/projects"}
                    >
                      All Projects
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/projects/new"
                      isActive={pathname === "/dashboard/projects/new"}
                    >
                      New Project
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User />
                  <span>Account</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/account"
                      isActive={pathname === "/dashboard/account"}
                    >
                      Profile
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/password"
                      isActive={pathname === "/dashboard/password"}
                    >
                      Password
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageCircle />
                  <span>Message</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="/dashboard/chat"
                      isActive={pathname === "/dashboard/chat"}
                    >
                      Chat
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
