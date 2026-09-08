import { IndianRupee } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

interface AmountInputProps extends Omit<TextInputProps, "keyboardType"> {
  label: string;
  error?: string;
  containerClassName?: string;
  icon?: ReactNode;
}

export function AmountInput({
  label,
  error,
  containerClassName,
  className,
  icon,
  onFocus,
  onBlur,
  ...props
}: AmountInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className={cn("gap-1.5", containerClassName)}>
      <View className={cn("gap-2", icon && "flex-row items-center gap-3")}>
        <View className={cn("flex-row items-center gap-2", icon && "min-w-0 flex-1")}>
          {icon}
          <Text className="text-ink flex-1 text-base font-medium">{label}</Text>
        </View>
        <View
          className={cn(
            "rounded-control min-h-12 flex-row items-center border px-3",
            icon && "w-[48%]",
            focused ? "bg-accent-soft border-accent" : "bg-canvas border-border",
            error && "border-destructive"
          )}
        >
          <IndianRupee color="#4D544C" size={17} strokeWidth={2} />
          <TextInput
            accessibilityLabel={label}
            className={cn(
              "text-ink min-h-12 min-w-0 flex-1 pl-1 text-right text-lg font-medium tabular-nums outline-none",
              className
            )}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#4D544C"
            selectionColor="#B6532B"
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            {...props}
          />
        </View>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-destructive text-sm leading-5">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
