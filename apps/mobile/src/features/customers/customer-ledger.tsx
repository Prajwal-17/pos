import { useState } from "react";
import { View } from "react-native";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Choices, FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { useDesktopList } from "@/lib/db/use-desktop-query";
import { listCustomerLedger } from "./customers.repository";
import type { LedgerFilters } from "./customers.types";
import { LedgerRow, ledgerLabels } from "./ledger-row";

export function CustomerLedger({ id }: { id: string }) {
  const [text, setText] = useState("");
  const search = useSearch(text);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Omit<LedgerFilters, "search">>({
    type: "all",
    range: { period: "all" },
    sort: "newest"
  });
  const list = useDesktopList(["customer-ledger", id, search, filters], (db, page) =>
    listCustomerLedger(db, id, { ...filters, search }, page)
  );
  return (
    <View className="flex-1">
      <View className="flex-row gap-2 px-4 pt-3 pb-1">
        <View className="flex-1">
          <SearchField label="Search ledger" value={text} onChange={setText} />
        </View>
        <FilterButton
          onPress={() => setOpen(true)}
          active={
            filters.type !== "all" || filters.range.period !== "all" || filters.sort !== "newest"
          }
        />
      </View>
      <RecordList list={list} renderItem={(entry) => <LedgerRow entry={entry} />} />
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <Choices
          label="Entry type"
          value={filters.type}
          onChange={(type) => setFilters({ ...filters, type })}
          options={[
            ["all", "All"],
            ...Object.entries(ledgerLabels).filter(([key]) => key !== "estimate")
          ]}
        />
        <Choices
          label="Sort"
          value={filters.sort}
          onChange={(sort) => setFilters({ ...filters, sort })}
          options={[
            ["newest", "Newest first"],
            ["oldest", "Oldest first"]
          ]}
        />
        <DateRangeField
          value={filters.range}
          onChange={(range) => setFilters({ ...filters, range })}
        />
      </FilterSheet>
    </View>
  );
}
