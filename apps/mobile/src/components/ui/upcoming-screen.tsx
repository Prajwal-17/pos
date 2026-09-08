import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function UpcomingScreen({ title }: { title: string }) {
  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "left", "right"]}>
      <View className="mx-auto w-full max-w-xl px-4 py-3">
        <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
          {title}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center pb-12">
        <Text className="text-muted text-sm">Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
