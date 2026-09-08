import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Choices, FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { RecordRow } from "@/components/ui/record-row";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { useDesktopList, useDesktopQuery } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { periodNames, recordDate, type DateRange } from "@/lib/format/records";
import { listTransactions, transactionSummary } from "./transactions.repository";
import type { TransactionKind, TransactionSort } from "./transactions.types";

export function TransactionList({
  kind,
  customerId,
  initialRange = { period: "all" }
}: {
  kind: TransactionKind;
  customerId?: string;
  initialRange?: DateRange;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [range, setRange] = useState<DateRange>(initialRange);
  const [sort, setSort] = useState<TransactionSort>("newest");
  const [open, setOpen] = useState(false);
  const search = useSearch(text);
  const filters = { search, range, sort, customerId };
  const list = useDesktopList(["transactions", kind, filters], (db, page) =>
    listTransactions(db, kind, filters, page)
  );
  const summary = useDesktopQuery(["transaction-summary", kind, filters], (db) =>
    transactionSummary(db, kind, filters)
  );
  return (
    <View className="flex-1">
      <View className="flex-row gap-2 px-4 pt-2 pb-2">
        <View className="flex-1">
          <SearchField
            label={
              customerId
                ? "Search bill number"
                : `Search ${kind === "sale" ? "sales" : "estimates"}`
            }
            value={text}
            onChange={setText}
          />
        </View>
        <FilterButton
          active={range.period !== "all" || sort !== "newest"}
          onPress={() => setOpen(true)}
        />
      </View>
      <RecordList
        list={list}
        header={
          summary.data && (
            <View
              className={`rounded-control mt-1 flex-row flex-wrap items-center justify-between gap-2 px-3 py-3 ${kind === "sale" ? "bg-sales-soft" : "bg-estimate-soft"}`}
            >
              <Text className="text-ink text-sm">
                {range.period === "custom"
                  ? `${range.from} – ${range.to}`
                  : periodNames[range.period]}
              </Text>
              <Text className="text-ink text-lg font-semibold tabular-nums">
                {formatRupee(summary.data.total)}
              </Text>
            </View>
          )
        }
        renderItem={(bill) => (
          <RecordRow
            title={
              customerId
                ? `${kind === "sale" ? "Sale" : "Estimate"} #${bill.transactionNo}`
                : bill.customerName
            }
            meta={[
              customerId ? null : `#${bill.transactionNo}`,
              recordDate(bill.createdAt),
              bill.inLedger ? "In ledger" : null
            ]
              .filter(Boolean)
              .join(" · ")}
            right={
              <Text className="text-ink text-base font-semibold tabular-nums">
                {formatRupee(bill.grandTotal)}
              </Text>
            }
            label={`Open ${kind} ${bill.transactionNo}`}
            onPress={() =>
              router.push({ pathname: "/bill/[kind]/[id]", params: { kind, id: bill.id } })
            }
          />
        )}
      />
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <Choices
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            ["newest", "Newest first"],
            ["oldest", "Oldest first"],
            ["high", "Amount high to low"],
            ["low", "Amount low to high"]
          ]}
        />
        <DateRangeField value={range} onChange={setRange} />
      </FilterSheet>
    </View>
  );
}
