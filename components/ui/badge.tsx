import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-semibold transition-all border-2 border-black/20 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0070F3] text-white shadow-xs hover:bg-[#0070F3]/80",
        destructive:
          "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/80 focus-visible:ring-[#E5484D]/20 dark:focus-visible:ring-[#E5484D]/40 dark:bg-[#E5484D]/60",
        outline:
          "bg-card border border-border shadow-xs hover:bg-card/80 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent border-transparent hover:text-accent-foreground dark:hover:bg-accent/50",
        cyan: "bg-[#00B8D4] text-white shadow-xs hover:bg-[#00B8D4]/80",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
        warning: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]/80",
        teal: "bg-[#12A594] text-white shadow-xs hover:bg-[#12A594]/80",
        red: "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/80",
        blue: "bg-[#0070F3] text-white shadow-xs hover:bg-[#0070F3]/80",
        amber: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]/80",
        green: "bg-[#46A758] text-white shadow-xs hover:bg-[#46A758]/80",
        purple: "bg-[#8E4EC6] text-white shadow-xs hover:bg-[#8E4EC6]/80",
        Pink: "bg-[#E93D82] text-white shadow-xs hover:bg-[#E93D82]/80",
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