
// app/dashboard/projects/[id]/components/reviews_Dialogs/CreateReviewLinkDialog.tsx
"use client";

import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Copy,
  ExternalLink,
  Link,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { MediaFile } from "@/app/dashboard/lib/types";


interface CreateLinkDialogState {
  open: boolean;
  mediaFile?: MediaFile;
  isCreating: boolean;
  showSuccess: boolean;
  createdUrl?: string;
}

interface CreateReviewLinkDialogProps {
  createLinkDialog: CreateLinkDialogState;
  onCreateLinkDialogChange: (dialog: CreateLinkDialogState) => void;
  onCreateReviewLink: (
    mediaFile: MediaFile,
    options: {
      title: string;
      expiresAt?: string;
      requiresPassword: boolean;
      password?: string;
    }
  ) => void;
}

interface CustomCalendarProps {
  selected?: Date;
  onSelect: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
}

function CustomCalendar({ selected, onSelect, disabled }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = new Date(day);
      const isDisabled = disabled ? disabled(cloneDay) : false;
      const isSelected = selected ? isSameDay(day, selected) : false;
      const isCurrentMonth = isSameMonth(day, monthStart);

      days.push(
        <button
          type="button"
          className={cn(
            "h-9 w-9 flex bg-background items-center justify-center text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
            isCurrentMonth ? "text-foreground" : "text-muted-foreground",
            isSelected && "bg-primary text-primary-foreground",
            !isSelected &&
              isCurrentMonth &&
              !isDisabled &&
              "hover:bg-accent hover:text-accent-foreground",
            isDisabled && "text-muted-foreground cursor-not-allowed opacity-50"
          )}
          key={day.toString()}
          onClick={() => !isDisabled && onSelect(cloneDay)}
          disabled={isDisabled}
        >
          <span>{formattedDate}</span>
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth} type="button">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth} type="button">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-1">{rows}</div>
    </div>
  );
}

export function CreateReviewLinkDialog({
  createLinkDialog,
  onCreateLinkDialogChange,
  onCreateReviewLink,
}: CreateReviewLinkDialogProps) {
  const [linkFormData, setLinkFormData] = useState({
    title: "",
    expiresAt: "",
    requiresPassword: false,
    password: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date);
    if (date) {
      // Set time to end of day (23:59:59) for the selected date
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const isoString = endOfDay.toISOString();
      setLinkFormData((prev) => ({ ...prev, expiresAt: isoString }));
    } else {
      setLinkFormData((prev) => ({ ...prev, expiresAt: "" }));
    }
  };

const handleCopyReviewLink = async (linkToken: string) => {
  const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/review/${linkToken}`;
  try {
    await navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Link Copied",
      description: "Review link copied to clipboard",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Failed to Copy",
      description: "Could not copy link to clipboard",
      variant: "destructive",
    });
  }
};

  return (
    <Dialog
      open={createLinkDialog.open}
      onOpenChange={(open) =>
        onCreateLinkDialogChange({
          open,
          isCreating: false,
          showSuccess: false,
        })
      }
    >
      <DialogContent className="bg-primary-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createLinkDialog.showSuccess
              ? "Review Link Created!"
              : "Create Review Link"}
          </DialogTitle>
        </DialogHeader>

       {createLinkDialog.showSuccess ? (
  <div className="space-y-4">
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-3">
        <div className="bg-green-700 p-2 rounded-[10px] border-2 border-black/20">
          <Check className="h-5 w-5 text-green-200" />
        </div>
        <div>
          <p className="font-medium">Link created successfully!</p>
          <p className="text-sm text-muted-foreground">
            The link has been copied to your clipboard
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Label className="text-gray-300">Review Link</Label>
      <div className="flex items-center gap-2">
        <Input
          value={createLinkDialog.createdUrl ? 
            `${process.env.NEXT_PUBLIC_BASE_URL}/review/${createLinkDialog.createdUrl.split("/").pop()}` : 
            ""
          }
          readOnly
          className="font-mono text-sm "
        />
        <Button
          variant="outline"
          onClick={() =>
            handleCopyReviewLink(
              createLinkDialog.createdUrl?.split("/").pop() || ""
            )
          }
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const linkToken = createLinkDialog.createdUrl?.split("/").pop();
            if (linkToken) {
              window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/review/${linkToken}`, "_blank");
            }
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="flex justify-end">
      <Button
        onClick={() =>
          onCreateLinkDialogChange({
            open: false,
            isCreating: false,
            showSuccess: false,
          })
        }
      >
        Done
      </Button>
    </div>
  </div>
) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (createLinkDialog.mediaFile) {
                onCreateReviewLink(createLinkDialog.mediaFile, {
                  title: linkFormData.title,
                  expiresAt: linkFormData.expiresAt || undefined,
                  requiresPassword: linkFormData.requiresPassword,
                  password: linkFormData.password || undefined,
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Review Title (Optional)</Label>
              <Input className="mt-1"
                id="title"
                value={linkFormData.title}
                onChange={(e) =>
                  setLinkFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter a title for this review"
              
              />
            </div>

            <div className="space-y-2">
              <Label>Expiration Date (Optional)</Label>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CustomCalendar 
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                    />
                    {selectedDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => handleDateChange(undefined)}
                          className="w-full"
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <p className="text-xs text-muted-foreground">
                Leave blank for permanent link. Selected date will expire at end
                of day.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresPassword"
                checked={linkFormData.requiresPassword}
                onCheckedChange={(checked) =>
                  setLinkFormData((prev) => ({
                    ...prev,
                    requiresPassword: checked,
                  }))
                }
              />
              <Label htmlFor="requiresPassword">
                Require password to access
              </Label>
            </div>

            {linkFormData.requiresPassword && (
              <div>
                <Label htmlFor="password" >Password</Label>
                <Input className="mt-2"
                  id="password"
                  type="password"
                  value={linkFormData.password}
                  onChange={(e) =>
                    setLinkFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password"
                 
                  required={linkFormData.requiresPassword}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onCreateLinkDialogChange({
                    open: false,
                    isCreating: false,
                    showSuccess: false,
                  })
                }
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLinkDialog.isCreating}>
                {createLinkDialog.isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Create & Copy Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
