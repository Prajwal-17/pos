import type { LucideIcon } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

interface AppButtonProps extends Omit<PressableProps, "children">, PropsWithChildren {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary",
  outline: "border-border bg-surface",
  ghost: "border-transparent bg-transparent",
  destructive: "border-destructive bg-destructive"
};

const textStyles: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  outline: "text-ink",
  ghost: "text-muted",
  destructive: "text-white"
};

const iconColors: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  outline: "#20231F",
  ghost: "#4D544C",
  destructive: "#FFFFFF"
};

export function AppButton({
  variant = "primary",
  icon: Icon,
  loading = false,
  compact = false,
  disabled,
  className,
  children,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      className={cn(
        "rounded-control flex-row items-center justify-center gap-2 border px-4",
        compact ? "min-h-11" : "min-h-12",
        buttonStyles[variant],
        isDisabled && "opacity-50",
        className
      )}
      style={({ pressed }) => ({ opacity: pressed && !isDisabled ? 0.78 : 1 })}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColors[variant]} size="small" />
      ) : Icon ? (
        <Icon color={iconColors[variant]} size={18} strokeWidth={2} />
      ) : null}
      <Text
        className={cn(
          "shrink text-center font-semibold",
          compact ? "text-sm" : "text-base",
          textStyles[variant]
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}
