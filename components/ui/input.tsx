import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> & {
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerClassName?: string;
  clearable?: boolean;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type,
      leftIcon,
      rightAdornment,
      clearable = false,
      onValueChange,
      onClear,
      value,
      onChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const stringValue = typeof value === "string" ? value : "";
    const showClearButton = clearable && !disabled && stringValue.length > 0;

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;

        if (typeof ref === "function") {
          ref(node);
          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    return (
      <div className={cn("relative", containerClassName)}>
        {leftIcon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        ) : null}
        <input
          ref={setInputRef}
          type={type}
          value={value}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }}
          data-slot="input"
          disabled={disabled}
          className={cn(
            "h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#414141] shadow-sm outline-none transition-all placeholder:text-[#a3a3a3] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "focus:border-[#283618] focus:ring-2 focus:ring-[#283618]/20",
            "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
            leftIcon ? "pl-10" : "",
            showClearButton || rightAdornment ? "pr-10" : "",
            className,
          )}
          {...props}
        />
        {showClearButton ? (
          <button
            type="button"
            aria-label="Clear input"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={() => {
              const input = internalRef.current;
              if (input) {
                const valueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value",
                )?.set;
                valueSetter?.call(input, "");
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
              } else {
                onValueChange?.("");
              }
              onClear?.();
            }}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : rightAdornment ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightAdornment}
          </div>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
