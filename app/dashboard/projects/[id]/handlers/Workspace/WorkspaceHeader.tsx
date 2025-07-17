// app/dashboard/projects/[id]/handlers/Workspace/WorkspaceHeader.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UsersIcon } from "@heroicons/react/24/solid";
import {
  MediaCardsPanel,
  MediaPlayerPanel,
  CommentsPanel,
} from "@/app/components/icons";
import { TeamManagement } from "../../components/TeamManagement/TeamManagement";
import { ProjectRole } from "./permissionHandlers";

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

interface WorkspaceHeaderProps {
  projectName: string;
  projectId: string;
  isOwner: boolean;
  userRole: ProjectRole | null;
  members: ProjectMember[];
  canManageMembers: boolean;
  canComment: boolean;
  isMobile: boolean;
  showTeamDialog: boolean;
  setShowTeamDialog: (show: boolean) => void;
  showMediaLibrary: boolean;
  showMediaPlayer: boolean;
  showCommentsPanel: boolean;
  canToggleMediaLibrary: boolean;
  playerLocked: boolean;
  commentsLocked: boolean;
  openPanelsCount: number;
  onMediaLibraryToggle: () => void;
  onMediaPlayerToggle: () => void;
  onCommentsToggle: () => void;
  onMembersUpdate: (members: ProjectMember[]) => void;
}

export function WorkspaceHeader({
  projectName,
  projectId,
  isOwner,
  userRole,
  members,
  canManageMembers,
  canComment,
  isMobile,
  showTeamDialog,
  setShowTeamDialog,
  showMediaLibrary,
  showMediaPlayer,
  showCommentsPanel,
  canToggleMediaLibrary,
  playerLocked,
  commentsLocked,
  openPanelsCount,
  onMediaLibraryToggle,
  onMediaPlayerToggle,
  onCommentsToggle,
  onMembersUpdate,
}: WorkspaceHeaderProps) {
  return (
    <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0">
      <div className="flex items-center h-full">
        <div className="flex items-center justify-center border-l border-r h-full mr-3">
          <div className="flex items-center mr-2 ml-2 h-full">
            <SidebarTrigger />
          </div>
        </div>
        <div className="border-r flex items-center h-full">
          <div className="mr-3 flex items-center gap-2">
            <span className="text-sm md:text-base">
              {projectName} - Project
            </span>
            {!isOwner && userRole && (
              <Badge variant="outline" className="text-sm">
                {userRole}
              </Badge>
            )}
          </div>
        </div>

        {canManageMembers && (
          <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
            <DialogTrigger asChild>
              <div className="border-r flex items-center border-border h-full">
                <Button
                  variant="ghost"
                  className="border-none bg-none ml-1 mr-1"
                  size="icon"
                  title="Manage Team Members"
                >
                  <UsersIcon className="size-5" />
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[80vh] overflow-y-auto"
              showCloseButton={false}
            >
              <TeamManagement
                projectId={projectId}
                members={members}
                isOwner={isOwner}
                onMembersUpdate={onMembersUpdate}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isMobile && (
        <div className="flex items-center gap-1">
          <Button
            onClick={onMediaLibraryToggle}
            variant="ghost"
            className="border-none bg-none"
            size="icon"
            disabled={showMediaLibrary && !canToggleMediaLibrary}
            title={
              showMediaLibrary && !canToggleMediaLibrary
                ? openPanelsCount === 1
                  ? "Cannot hide Media Library when it's the only panel open"
                  : openPanelsCount === 2
                    ? "Cannot hide Media Library - other panels cannot be alone"
                    : undefined
                : undefined
            }
          >
            <MediaCardsPanel
              className={`size-5 ${
                showMediaLibrary && !canToggleMediaLibrary
                  ? "opacity-50"
                  : showMediaLibrary
                    ? "text-blue-500"
                    : ""
              }`}
            />
          </Button>

          <Button
            onClick={onMediaPlayerToggle}
            variant="ghost"
            className="border-none bg-none"
            size="icon"
            disabled={
              playerLocked ||
              (!showMediaPlayer && !showMediaLibrary) ||
              (showMediaPlayer && openPanelsCount === 1)
            }
          >
            <MediaPlayerPanel
              className={`size-5 ${
                playerLocked ||
                (!showMediaPlayer && !showMediaLibrary) ||
                (showMediaPlayer && openPanelsCount === 1)
                  ? "opacity-50"
                  : showMediaPlayer
                    ? "text-blue-500"
                    : ""
              }`}
            />
          </Button>

          <Button
            onClick={onCommentsToggle}
            variant="ghost"
            className="border-none bg-none mr-2"
            size="icon"
            disabled={
              !canComment ||
              commentsLocked ||
              (!showCommentsPanel && !showMediaLibrary) ||
              (showCommentsPanel && openPanelsCount === 1)
            }
          >
            <CommentsPanel
              className={`size-5 ${
                !canComment ||
                commentsLocked ||
                (!showCommentsPanel && !showMediaLibrary) ||
                (showCommentsPanel && openPanelsCount === 1)
                  ? "opacity-50"
                  : showCommentsPanel
                    ? "text-blue-500"
                    : ""
              }`}
            />
          </Button>
        </div>
      )}
    </header>
  );
}
