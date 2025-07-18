import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center border-2 border-muted/20 justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#0070F3] text-white shadow-xs hover:bg-[#0070F3]/80",
        destructive: "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/80 ",
        outline:
          "bg-card border-2 border-border shadow-xs hover:bg-card/80 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent border-transparent hover:text-accent-foreground dark:hover:bg-accent/50",

        link: "text-primary underline-offset-4 hover:underline",
        cyan: "bg-[#00B8D4] text-white shadow-xs hover:bg-[#00B8D4]/80",
        warning: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]/80",
        teal: "bg-[#12A594] text-white shadow-xs hover:bg-[#12A594]/80",
        red: "bg-[#E5484D] text-white shadow-xs hover:bg-[#E5484D]/80",
        blue: "bg-[#0070F3] text-white shadow-xs hover:bg-[#0070F3]/80",
        amber: "bg-[#FFB224] text-white shadow-xs hover:bg-[#FFB224]/80",
        green: "bg-[#46A758] text-white shadow-xs hover:bg-[#46A758]/80",
        purple: "bg-[#8E4EC6] text-white shadow-xs hover:bg-[#8E4EC6]/80",
        Pink: "bg-[#E93D82] text-white shadow-xs hover:bg-[#E93D82]/80",
        not: "text-white  border-none",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-9 md:h-8 md:w-auto md:px-3 md:gap-1.5",
        "icon-default": "size-9 md:h-9 md:w-auto md:px-4 md:py-2",
        "icon-lg": "size-9 md:h-10 md:w-auto md:px-6",
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
