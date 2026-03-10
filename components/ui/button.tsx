import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-[#283618] focus-visible:ring-4 focus-visible:ring-[#283618]/10",
  {
    variants: {
      variant: {
        default:
          "border-[#283618] bg-[#283618] text-white shadow-sm hover:bg-[#31421f]",
        destructive:
          "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50",
        secondary:
          "border-[#ece5c8] bg-[#ece5c8] text-[#414141] shadow-sm hover:bg-[#f6f3e6]",
        ghost: "border-transparent bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        link: "h-auto border-transparent bg-transparent p-0 text-[#283618] underline-offset-4 hover:underline",
        flat:
          "border-transparent bg-transparent text-gray-400 hover:bg-[#283618]/5 hover:text-[#283618]",
        info: "border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700",
        success: "border-green-600 bg-green-600 text-white shadow-sm hover:bg-green-700",
        warning: "border-amber-600 bg-amber-600 text-white shadow-sm hover:bg-amber-700",
        purple: "border-purple-600 bg-purple-600 text-white shadow-sm hover:bg-purple-700",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
        card: "h-auto flex-col items-start rounded-2xl p-5 text-left",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
