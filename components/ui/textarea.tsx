import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "min-h-[120px] w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#414141] shadow-sm outline-none transition-all placeholder:text-[#a3a3a3] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-[#283618] focus:ring-2 focus:ring-[#283618]/20",
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
