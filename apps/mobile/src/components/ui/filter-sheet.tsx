import { Check, SlidersHorizontal, X } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "./icon-button";
import { AppButton } from "./app-button";

export function FilterButton({
  onPress,
  active = false
}: {
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <IconButton
      label="Filters"
      icon={SlidersHorizontal}
      onPress={onPress}
      className={active ? "border-accent bg-accent-soft" : ""}
    />
  );
}

export function FilterSheet({
  open,
  onClose,
  children,
  title = "Filters"
}: PropsWithChildren<{ open: boolean; onClose: () => void; title?: string }>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/30">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss filters"
          className="absolute inset-0"
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          className="bg-canvas max-h-[90%] rounded-t-[24px]"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
              {title}
            </Text>
            <IconButton icon={X} label="Close filters" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
          >
            {children}
          </ScrollView>
          <View className="px-4 pt-2">
            <AppButton onPress={onClose}>Done</AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Choices<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-muted mt-2 mb-1 text-xs font-semibold">{label}</Text>
      <View className="rounded-control border-border bg-surface overflow-hidden border">
        {options.map(([key, text], index) => (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === key }}
            aria-checked={value === key}
            accessibilityLabel={`${label}: ${text}`}
            onPress={() => onChange(key)}
            className={`min-h-12 flex-row items-center justify-between gap-3 px-3 ${index ? "border-border border-t" : ""}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Text className="text-ink flex-1 text-base">{text}</Text>
            {value === key && <Check size={18} color="#B6532B" />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
