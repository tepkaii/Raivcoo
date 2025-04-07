import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "border-2 border-[#3F3F3F] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ",
  {
    variants: {
      variant: {
        default: "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90",
        destructive: "bg-[#F43F5E] text-white hover:bg-[#F43F5E]/90",
        outline: "bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:text-white",
        secondary: "bg-[#A78BFA] text-white hover:bg-[#A78BFA]/80",
        ghost: "bg-transparent border-0 hover:bg-[#2D2D2D] hover:text-white",
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
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const RevButtons = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
RevButtons.displayName = "RevButtons";

// Export colors for reference elsewhere if needed
export const colors = {
  primary: "#8B5CF6",
  destructive: "#F43F5E",
  secondary: "#A78BFA",
  success: "#10B981",
  info: "#3B82F6",
  warning: "#F59E0B",
  edit: "#6366F1",
  settings: "#64748B",
  background: "#1F1F1F",
  accent: "#2D2D2D",
  input: "#3F3F3F",
  cyan: "#06B6D4",
  yellow: "#FACC15",
  red: "#EF4444",
  blue: "#2563EB",
  pink: "#EC4899",
  gray: "#71717A",
  gold: "#D4A017",
};

export { RevButtons, buttonVariants };