"use client";

import {
  Paperclip,
  Send,
  Clock,
  CheckCircle,
  Globe,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { RevButtons } from "./RevButtons";

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
  imageFiles?: File[];
  onRemoveImage?: (index: number) => void;
  currentTime?: number;
  isVideoFile?: boolean;
  formatTime?: (time: number) => string;
  maxImages?: number;
  onTimeChange?: (newTime: number) => void;
}

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "Add your feedback...",
  minHeight = 48,
  maxHeight = 164,
  onSubmit,
  onFileSelect,
  className,
  disabled = false,
  imageFiles = [],
  onRemoveImage,
  currentTime = 0,
  isVideoFile = false,
  formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
  maxImages = 4,
  onTimeChange,
}: AIInputWithSearchProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [isEditingTime, setIsEditingTime] = useState(false);

  const handleSubmit = () => {
    if (isEditingTime) {
      // Save time mode
      const [minutes, seconds] = value.split(":").map(Number);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        const newTime = minutes * 60 + seconds;
        onTimeChange?.(newTime);
        setIsEditingTime(false);
        setValue("");
      }
    } else if (value.trim() && !disabled) {
      // Normal submit mode
      onSubmit?.(value);
      setValue("");
      adjustHeight(true);
    }
  };

  const enterEditTimeMode = () => {
    setIsEditingTime(true);
    setValue(formatTime(currentTime));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !disabled) {
      onFileSelect?.(file);
    }
    // Reset file input
    if (e.target) {
      e.target.value = "";
    }
  };

  const canAddMoreImages = imageFiles.length < maxImages;

  return (
    <div className={cn("w-full py-4", className)}>
      {/* Images preview directly inside the input container */}
      <div className="relative max-w-xl w-full mx-auto">
        {/* Images and time in one row, no extra space */}
        {(imageFiles.length > 0 || isVideoFile) && (
          <div className="flex items-center justify-between mb-2 px-4">
            {/* Images on the left */}
            <div className="flex items-center gap-2">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative w-10 h-10 group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  <button
                    onClick={() => onRemoveImage?.(index)}
                    className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    disabled={disabled}
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Time on the right */}
            {isVideoFile && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(currentTime)}</span>
              </div>
            )}
          </div>
        )}

        <div className="relative flex flex-col bg-background border-2 border-dashed rounded-2xl">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={isEditingTime ? "MM:SS" : placeholder}
              className="w-full  px-4 py-3    border-none  placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2]"
              ref={textareaRef}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !disabled) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
            />
          </div>

          <div className="h-12 ">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              {/* File upload */}
              <RevButtons
                variant={"outline"}
                size={"icon"}
                disabled={!canAddMoreImages || disabled || isEditingTime}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={!canAddMoreImages || disabled || isEditingTime}
                  accept="image/jpeg,image/png,image/webp"
                />
                <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors" />
              </RevButtons>

              {/* Time button with search animation */}
              {isVideoFile && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingTime) {
                      setIsEditingTime(false);
                      setValue("");
                    } else {
                      enterEditTimeMode();
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    "rounded-[10px] border-2 transition-all flex items-center gap-2 px-1.5 py-1  h-8",
                    isEditingTime
                      ? "bg-purple-500/15 border-purple-900 text-purple-500"
                      : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{
                        rotate: isEditingTime ? 180 : 0,
                        scale: isEditingTime ? 1.1 : 1,
                      }}
                      whileHover={{
                        rotate: isEditingTime ? 180 : 15,
                        scale: 1.1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        },
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                      }}
                    >
                      <Clock
                        className={cn(
                          "w-4 h-4",
                          isEditingTime ? "text-purple-500" : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {isEditingTime && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm overflow-hidden whitespace-nowrap text-purple-500 flex-shrink-0"
                      >
                        Time
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled || (!value.trim() && !isEditingTime)}
                className={cn(
                  "rounded-lg p-2 border-2 transition-colors",
                  isEditingTime && value
                    ? "bg-green-500/15 text-green-500"
                    : value.trim() || imageFiles.length > 0
                      ? "bg-sky-500/15 text-sky-500 "
                      : "bg-black/5 dark:bg-white/5 text-black/40  dark:text-white/40 hover:text-black dark:hover:text-white",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {isEditingTime ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Max images notification */}
      {!canAddMoreImages && imageFiles.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  );
}
