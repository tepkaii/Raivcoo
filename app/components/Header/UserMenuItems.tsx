"use client";
import AccountForm from "@/app/account/AccountForm";
import { updateAccount } from "@/app/account/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { LogOut, SquareUser } from "lucide-react";
import { useState } from "react";

export function UserMenuItems({ initialPortfolio }: { initialPortfolio: any }) {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  return (
    <>
      <DropdownMenuItem
        onClick={() => setAccountDialogOpen(true)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <SquareUser className="h-4 w-4" />
        <span>Account</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          {initialPortfolio && (
            <AccountForm
              Account={initialPortfolio}
              updateAccount={updateAccount}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
