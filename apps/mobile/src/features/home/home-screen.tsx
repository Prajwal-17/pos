import { useRouter } from "expo-router";
import { Banknote, ChartNoAxesCombined } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { RecordRow } from "@/components/ui/record-row";
import { LoadState, Screen, SectionLabel } from "@/components/ui/screen";
import { useDesktopQuery } from "@/lib/db/use-desktop-query";
import { getTodayIST } from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { recordDate } from "@/lib/format/records";
import { getHomeSummary, recentBills } from "./home.repository";

export default function HomeScreen() {
  const router = useRouter();
  const today = getTodayIST();
  const summary = useDesktopQuery(["home", today], getHomeSummary);
  const recent = useDesktopQuery(["recent-bills"], recentBills);
  return (
    <Screen title="Home" actions={<Text className="text-muted text-xs">{recordDate(today)}</Text>}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View className="flex-row gap-3 pt-2 pb-3">
          <AppButton className="flex-1" icon={Banknote} onPress={() => router.push("/money")}>
            Money entry
          </AppButton>
          <AppButton
            className="flex-1"
            variant="outline"
            icon={ChartNoAxesCombined}
            onPress={() => router.push("/reports")}
          >
            Reports
          </AppButton>
        </View>
        {!summary.data ? (
          <LoadState loading={summary.loading} error={summary.error} retry={summary.retry} />
        ) : (
          <>
            <View className="flex-row gap-3">
              {(["sales", "estimates"] as const).map((kind) => (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityLabel={`Today's ${kind}`}
                  onPress={() =>
                    router.push({
                      pathname: kind === "sales" ? "/sales" : "/estimates",
                      params: { period: "today" }
                    })
                  }
                  className={`rounded-control border-border min-h-28 min-w-0 flex-1 border p-3 ${kind === "sales" ? "bg-sales-soft" : "bg-estimate-soft"}`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={`text-sm font-medium ${kind === "sales" ? "text-sales-ink" : "text-estimate-ink"}`}
                  >
                    {kind === "sales" ? "Sales today" : "Estimates today"}
                  </Text>
                  <Text className="text-ink mt-3 text-2xl font-semibold tabular-nums">
                    {formatRupee(summary.data![kind === "sales" ? "salesTotal" : "estimatesTotal"])}
                  </Text>
                  <Text className="text-muted mt-1 text-xs">
                    {summary.data![kind === "sales" ? "salesCount" : "estimatesCount"]} bills
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="rounded-control border-border bg-surface mt-3 flex-row border">
              {(["customers", "products"] as const).map((kind, index) => (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${kind}`}
                  onPress={() => router.push(kind === "customers" ? "/customers" : "/products")}
                  className={`min-h-16 flex-1 flex-row flex-wrap items-center justify-between gap-2 px-3 py-2 ${index ? "border-border border-l" : ""}`}
                >
                  <Text className="text-muted text-xs">
                    {kind === "customers" ? "Customers" : "Products"}
                  </Text>
                  <Text className="text-ink text-base font-semibold tabular-nums">
                    {summary.data![kind].toLocaleString("en-IN")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <SectionLabel>Recent bills</SectionLabel>
        {!recent.data ? (
          <LoadState loading={recent.loading} error={recent.error} retry={recent.retry} />
        ) : !recent.data.length ? (
          <LoadState empty="No bills" />
        ) : (
          <View className="rounded-control border-border overflow-hidden border">
            {recent.data.map((bill, index) => (
              <View key={bill.id} className={index ? "border-border border-t" : ""}>
                <RecordRow
                  title={bill.customerName}
                  meta={`${bill.kind === "sale" ? "Sale" : "Estimate"} #${bill.number} · ${recordDate(bill.date)}`}
                  right={
                    <Text className="text-ink text-base font-semibold tabular-nums">
                      {formatRupee(bill.total)}
                    </Text>
                  }
                  label={`Open ${bill.kind} ${bill.number}`}
                  onPress={() =>
                    router.push({
                      pathname: "/bill/[kind]/[id]",
                      params: { kind: bill.kind, id: bill.billId }
                    })
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
