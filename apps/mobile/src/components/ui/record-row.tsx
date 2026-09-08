import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function RecordRow({
  title,
  meta,
  right,
  children,
  onPress,
  label
}: {
  title: string;
  meta?: string;
  right?: ReactNode;
  children?: ReactNode;
  onPress?: () => void;
  label?: string;
}) {
  const content = (
    <>
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-ink text-base font-medium" numberOfLines={2}>
            {title}
          </Text>
          {!!meta && (
            <Text className="text-muted mt-1 text-xs leading-4" numberOfLines={2}>
              {meta}
            </Text>
          )}
        </View>
        {!!right && (
          <View style={{ maxWidth: "48%" }} className="items-end">
            {right}
          </View>
        )}
      </View>
      {children}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-surface min-h-[72px] px-3 py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      {content}
    </Pressable>
  ) : (
    <View className="bg-surface min-h-[72px] px-3 py-3">{content}</View>
  );
}
