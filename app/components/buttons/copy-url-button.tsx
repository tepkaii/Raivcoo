"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Share2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SharePortfolioLinkProps {
  subdomain: string;
  isPublished: boolean;
}

export function SharePortfolioLink({
  subdomain,
  isPublished,
}: SharePortfolioLinkProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (!isPublished) return;

    const url = `https://${subdomain}.raivcoo.com`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your portfolio link is ready to share.",
        variant: "success",
        duration: 3000,
      });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast({
        title: "Copy failed",
        description: "Couldn't copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileTap={{ scale: 0.95 }}>
            <button
              onClick={copyToClipboard}
              className={`w-full flex justify-center sm:p-2 p-1.5 dark:bg-[#0b1c16] bg-[#e7f8f2] border-2 text-emerald-500 dark:hover:bg-emerald-500/20 hover:bg-emerald-500/30 rounded-[5px] duration-300 ${
                !isPublished ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!isPublished}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <Check className=" text-emerald-500 size-3 sm:size-4 md:size-5 " />
                    <span className="text-emerald-500 text-xs sm:text-sm lg:text-base">
                      Copied!
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    {isPublished ? (
                      <>
                        <Share2 className="size-3 sm:size-4 md:size-5 " />
                        <span className="text-xs sm:text-sm lg:text-base">
                          Share Link
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-3 sm:size-4 md:size-5 " />
                        <span className="text-xs sm:text-sm lg:text-base">
                          {" "}
                          Private{" "}
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isPublished ? (
            <p>Click to copy portfolio link</p>
          ) : (
            <p>Portfolio is private or unpublished</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
