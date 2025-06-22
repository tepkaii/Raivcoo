import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-semibold transition-all border-2 border-black/20 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0070F3] text-white hover:bg-[#0070F3]/90",
        destructive:
          "bg-[#E5484D] text-white hover:bg-[#E5484D]/90 focus-visible:ring-[#E5484D]/20 dark:focus-visible:ring-[#E5484D]/40",
        outline:
          "border bg-primary-foreground border-2 border-black/20 hover:bg-accent hover:text-accent-foreground ",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 border-transparent",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
        warning: "bg-[#FFB224] text-white hover:bg-[#FFB224]/90",
        teal: "bg-[#12A594] text-white hover:bg-[#12A594]/90",
        red: "bg-[#E5484D] text-white hover:bg-[#E5484D]/90",
        blue: "bg-[#0070F3] text-white hover:bg-[#0070F3]/90",
        amber: "bg-[#FFB224] text-white hover:bg-[#FFB224]/90",
        green: "bg-[#46A758] text-white hover:bg-[#46A758]/90",
        purple: "bg-[#8E4EC6] text-white hover:bg-[#8E4EC6]/90",
        pink: "bg-[#E93D82] text-white hover:bg-[#E93D82]/90",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };