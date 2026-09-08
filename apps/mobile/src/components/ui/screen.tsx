import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "./app-button";
import { IconButton } from "./icon-button";

export function Screen({
  title,
  back,
  actions,
  children
}: PropsWithChildren<{ title: string; back?: boolean; actions?: ReactNode }>) {
  const router = useRouter();
  return (
    <SafeAreaView
      edges={back ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}
      className="bg-canvas flex-1"
    >
      <View className="flex-row items-center gap-3 px-4 py-2">
        {back && (
          <IconButton
            label="Back"
            icon={ArrowLeft}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          />
        )}
        <Text
          accessibilityRole="header"
          className="text-ink flex-1 text-xl font-semibold"
          numberOfLines={2}
        >
          {title}
        </Text>
        {actions}
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}

export function LoadState({
  loading,
  error,
  empty = "No records",
  retry
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  retry?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-3 px-5 py-12">
      {loading ? (
        <ActivityIndicator color="#B6532B" accessibilityLabel="Loading records" />
      ) : (
        <>
          <Text className="text-muted text-center text-sm">{error || empty}</Text>
          {!!error && retry && (
            <AppButton compact variant="outline" onPress={retry}>
              Try again
            </AppButton>
          )}
        </>
      )}
    </View>
  );
}

export function SectionLabel({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View className="flex-row items-center justify-between gap-2 py-3">
      <Text accessibilityRole="header" className="text-ink text-base font-semibold">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="border-border gap-1 border-b py-3">
      <Text className="text-muted text-xs">{label}</Text>
      <Text selectable className="text-ink text-base">
        {value}
      </Text>
    </View>
  );
}
