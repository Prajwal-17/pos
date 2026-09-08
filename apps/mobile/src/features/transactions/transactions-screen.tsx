import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { parseLocalDate } from "@/lib/format/dates";
import { periodNames, type DateRange } from "@/lib/format/records";
import { TransactionList } from "./transaction-list";
import type { TransactionKind } from "./transactions.types";

export function TransactionsScreen({ kind }: { kind: TransactionKind }) {
  const params = useLocalSearchParams<{ period?: string; from?: string; to?: string }>();
  let range: DateRange = {
    period:
      params.period && Object.hasOwn(periodNames, params.period)
        ? (params.period as DateRange["period"])
        : "all"
  };
  if (range.period === "custom") {
    const from = parseLocalDate(params.from);
    const to = parseLocalDate(params.to);
    range = from && to && from <= to ? { period: "custom", from, to } : { period: "all" };
  }
  return (
    <Screen title={kind === "sale" ? "Sales" : "Estimates"}>
      <TransactionList key={JSON.stringify(range)} kind={kind} initialRange={range} />
    </Screen>
  );
}
