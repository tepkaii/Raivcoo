import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center border-2 border-black/20 justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#0070F3] text-primary shadow-xs hover:bg-[#0070F3]",
        destructive:
          "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/90 focus-visible:ring-[#E5484D]/20 dark:focus-visible:ring-[#E5484D]/40 dark:bg-[#E5484D]/60",
        outline:
          "border bg-background border-2 border-black/20 shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

        link: "text-primary underline-offset-4 hover:underline",

        warning: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]",
        teal: "bg-[#12A594] text-white shadow-xs hover:bg-[#12A594]",
        red: "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]",
        blue: "bg-[#0070F3] text-white shadow-xs hover:bg-[#0070F3]",
        amber: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]]",
        green: "bg-[#46A758] text-white shadow-xs hover:bg-[#46A758]",
        purple: "bg-[#8E4EC6] text-white shadow-xs hover:bg-[#8E4EC6]",
        Pink: "bg-[#E93D82] text-white shadow-xs hover:bg-[#E93D82]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
