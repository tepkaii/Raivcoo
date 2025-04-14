import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "border-[2px] border-[#3F3F3F] inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90",
        destructive: "bg-[#F43F5E] text-white hover:bg-[#F43F5E]/90",
        outline: "bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:text-white",
        secondary: "bg-[#A78BFA] text-white hover:bg-[#A78BFA]/80",
        ghost: "bg-transparent hover:bg-[#2D2D2D] hover:text-white",
        link: "bg-transparent text-[#8B5CF6] underline-offset-4 hover:underline border-transparent",
        success: "bg-[#10B981] text-white hover:bg-[#10B981]/90",
        info: "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90",
        warning: "bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90",
        edit: "bg-[#6366F1] text-white hover:bg-[#6366F1]/90",
        settings: "bg-[#64748B] text-white hover:bg-[#64748B]/90",
        cyan: "bg-[#06B6D4] text-white hover:bg-[#06B6D4]/90",
        yellow: "bg-[#FACC15] text-white hover:bg-[#FACC15]/90",
        red: "bg-[#EF4444] text-white hover:bg-[#EF4444]/90",
        blue: "bg-[#2563EB] text-white hover:bg-[#2563EB]/90",
        pink: "bg-[#EC4899] text-white hover:bg-[#EC4899]/90",
        gray: "bg-[#71717A] text-white hover:bg-[#71717A]/90",
        gold: "bg-[#D4A017] text-white hover:bg-[#D4A017]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
