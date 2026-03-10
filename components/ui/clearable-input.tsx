"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

type ClearableInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  leftIcon?: React.ReactNode;
};

export function ClearableInput({
  className,
  value,
  onChange,
  onClear,
  leftIcon,
  ...props
}: ClearableInputProps) {
  return (
    <Input
      className={className}
      value={value}
      onValueChange={onChange}
      onClear={onClear}
      leftIcon={leftIcon}
      clearable
      {...props}
    />
  );
}
