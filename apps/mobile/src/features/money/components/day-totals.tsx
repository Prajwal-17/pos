import { Text, View } from "react-native";
import { formatRupee } from "@/lib/format/money";

export function DayTotals({ received, paid }: { received: number; paid: number }) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap justify-between gap-x-4 gap-y-1">
        <Text className="text-muted text-sm">Received</Text>
        <Text className="text-ink text-base font-semibold tabular-nums">
          {formatRupee(received)}
        </Text>
      </View>
      <View className="flex-row flex-wrap justify-between gap-x-4 gap-y-1">
        <Text className="text-muted text-sm">Vendor payments</Text>
        <Text className="text-ink text-base font-semibold tabular-nums">− {formatRupee(paid)}</Text>
      </View>
      <View className="border-border flex-row flex-wrap items-center justify-between gap-2 border-t pt-3">
        <Text className="text-muted text-sm">Net</Text>
        <Text className="text-ink text-2xl font-semibold tabular-nums">
          {formatRupee(received - paid)}
        </Text>
      </View>
    </View>
  );
}
