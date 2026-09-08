import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DateRangeField } from "@/components/ui/date-range-field";
import { FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordRow } from "@/components/ui/record-row";
import { LoadState, Screen, SectionLabel } from "@/components/ui/screen";
import { useDesktopQuery } from "@/lib/db/use-desktop-query";
import { formatCompactRupee, formatRupee } from "@/lib/format/money";
import { periodNames, quantity, type DateRange } from "@/lib/format/records";
import { getReport } from "./reports.repository";

export default function ReportsScreen() {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>({ period: "month" });
  const [open, setOpen] = useState(false);
  const query = useDesktopQuery(["report", range], (db) => getReport(db, range));
  const report = query.data;
  const maximum = Math.max(
    1,
    ...(report?.trend.flatMap((point) => [point.sales, point.estimates]) ?? [])
  );
  return (
    <Screen
      title="Reports"
      back
      actions={<FilterButton onPress={() => setOpen(true)} active={range.period !== "month"} />}
    >
      {!report ? (
        <LoadState loading={query.loading} error={query.error} retry={query.retry} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Text className="text-muted pb-3 text-sm">
            {range.period === "custom" ? `${range.from} – ${range.to}` : periodNames[range.period]}
          </Text>
          <View className="flex-row gap-3">
            {(["sales", "estimates"] as const).map((kind) => (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityLabel={`View report ${kind}`}
                onPress={() =>
                  router.push({
                    pathname: kind === "sales" ? "/sales" : "/estimates",
                    params: { ...range }
                  })
                }
                className={`rounded-control border-border min-h-24 min-w-0 flex-1 border p-3 ${kind === "sales" ? "bg-sales-soft" : "bg-estimate-soft"}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-ink text-sm">{kind === "sales" ? "Sales" : "Estimates"}</Text>
                <Text className="text-ink mt-2 text-xl font-semibold tabular-nums">
                  {formatRupee(report[kind].total)}
                </Text>
                <Text className="text-muted mt-1 text-xs">
                  {report[kind].count.toLocaleString("en-IN")} bills
                </Text>
              </Pressable>
            ))}
          </View>
          <SectionLabel>Current balances</SectionLabel>
          <View className="rounded-control border-border overflow-hidden border">
            {(["due", "advance"] as const).map((kind, index) => (
              <View key={kind} className={index ? "border-border border-t" : ""}>
                <RecordRow
                  title={kind === "due" ? "Customer dues" : "Customer advances"}
                  right={
                    <Text className="text-ink text-base font-semibold tabular-nums">
                      {formatRupee(report.balances[kind])}
                    </Text>
                  }
                  label={`View customer ${kind}`}
                  onPress={() => router.push({ pathname: "/balances", params: { kind } })}
                />
              </View>
            ))}
          </View>
          <SectionLabel>Sales & estimates</SectionLabel>
          <View className="mb-2 flex-row gap-4">
            <Text className="text-sales-ink text-xs font-semibold">Sales</Text>
            <Text className="text-estimate-ink text-xs font-semibold">Estimates</Text>
          </View>
          <View className="rounded-control border-border bg-surface border px-3">
            {report.trend.map((point) => (
              <View
                key={point.date}
                accessibilityLabel={`${point.date}, sales ${formatRupee(point.sales)}, estimates ${formatRupee(point.estimates)}`}
                className="border-border flex-row items-center gap-3 border-b py-3"
              >
                <Text className="text-muted w-14 text-xs">
                  {point.date.length === 7
                    ? new Intl.DateTimeFormat("en-IN", {
                        month: "short",
                        year: "2-digit",
                        timeZone: "UTC"
                      }).format(new Date(point.date + "-01"))
                    : new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC"
                      }).format(new Date(point.date))}
                </Text>
                <View className="flex-1 gap-2">
                  {(["sales", "estimates"] as const).map((kind) => (
                    <View key={kind} className="flex-row items-center gap-2">
                      <View className="bg-canvas h-2 flex-1 overflow-hidden rounded-full">
                        <View
                          style={{
                            width: `${(point[kind] / maximum) * 100}%`,
                            height: 8,
                            backgroundColor: kind === "sales" ? "#1F9D72" : "#B44A68"
                          }}
                        />
                      </View>
                      <Text className="text-ink w-16 text-right text-xs tabular-nums">
                        {formatCompactRupee(point[kind])}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {!report.trend.length && (
              <Text className="text-muted py-5 text-center text-sm">No transactions</Text>
            )}
          </View>
          <SectionLabel>
            Top products <Text className="text-muted text-xs font-normal">by sales quantity</Text>
          </SectionLabel>
          {report.products.map((product) => (
            <View key={product.id} className="border-border border-b">
              <RecordRow
                title={product.name}
                meta={`Qty ${quantity(product.quantity)}`}
                right={
                  <Text className="text-ink text-sm font-semibold tabular-nums">
                    {formatRupee(product.total)}
                  </Text>
                }
                label={`Open product ${product.name}`}
                onPress={() =>
                  router.push({ pathname: "/product/[id]", params: { id: product.id } })
                }
              />
            </View>
          ))}
          {!report.products.length && (
            <Text className="text-muted py-4 text-sm">No product sales</Text>
          )}
        </ScrollView>
      )}
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <DateRangeField value={range} onChange={setRange} />
      </FilterSheet>
    </Screen>
  );
}
