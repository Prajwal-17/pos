import type { LucideIcon } from "lucide-react-native";
import { Pressable, type PressableProps } from "react-native";

import { cn } from "@/lib/utils";

interface IconButtonProps extends PressableProps {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "destructive";
  className?: string;
}

export function IconButton({
  icon: Icon,
  label,
  tone = "default",
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      className={cn(
        "rounded-control min-h-11 min-w-11 items-center justify-center border",
        tone === "destructive" ? "border-border bg-accent-soft" : "border-border bg-surface",
        disabled && "opacity-40",
        className
      )}
      style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.68 : 1 })}
      {...props}
    >
      <Icon color={tone === "destructive" ? "#9B342A" : "#283129"} size={19} strokeWidth={2} />
    </Pressable>
  );
}
