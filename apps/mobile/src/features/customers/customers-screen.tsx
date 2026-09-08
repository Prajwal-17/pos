import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Choices, FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { RecordRow } from "@/components/ui/record-row";
import { Screen } from "@/components/ui/screen";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { useDesktopList } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { balanceLabel, customerTypeLabel } from "@/lib/format/records";
import { listCustomers } from "./customers.repository";
import type { CustomerFilters } from "./customers.types";

export default function CustomersScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Omit<CustomerFilters, "search">>({
    type: "all",
    balance: "all",
    archived: "active",
    sort: "name"
  });
  const search = useSearch(text);
  const list = useDesktopList(["customers", search, filters], (db, page) =>
    listCustomers(db, { ...filters, search }, page)
  );
  return (
    <Screen
      title="Customers"
      actions={
        <FilterButton
          active={
            filters.type !== "all" ||
            filters.balance !== "all" ||
            filters.archived !== "active" ||
            filters.sort !== "name"
          }
          onPress={() => setOpen(true)}
        />
      }
    >
      <View className="px-4 pb-2">
        <SearchField label="Search customers" value={text} onChange={setText} />
      </View>
      <RecordList
        list={list}
        renderItem={(customer) => (
          <RecordRow
            title={customer.name}
            meta={[
              customerTypeLabel(customer.customerType),
              customer.contact,
              customer.isArchived ? "Archived" : null
            ]
              .filter(Boolean)
              .join(" · ")}
            label={`Open customer ${customer.name}`}
            onPress={() => router.push({ pathname: "/customer/[id]", params: { id: customer.id } })}
            right={
              <>
                <Text className="text-ink text-base font-semibold tabular-nums">
                  {formatRupee(Math.abs(customer.outstandingBalance ?? 0))}
                </Text>
                <Text className="text-muted mt-1 text-xs">
                  {balanceLabel(customer.outstandingBalance ?? 0)}
                </Text>
              </>
            }
          />
        )}
      />
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <Choices
          label="Customer type"
          value={filters.type}
          onChange={(type) => setFilters({ ...filters, type })}
          options={[
            ["all", "All"],
            ["cash", "Cash"],
            ["account", "Account"],
            ["hotel", "Hotel"]
          ]}
        />
        <Choices
          label="Balance"
          value={filters.balance}
          onChange={(balance) => setFilters({ ...filters, balance })}
          options={[
            ["all", "All"],
            ["due", "Due"],
            ["advance", "Advance"],
            ["settled", "Settled"]
          ]}
        />
        <Choices
          label="Status"
          value={filters.archived}
          onChange={(archived) => setFilters({ ...filters, archived })}
          options={[
            ["active", "Active"],
            ["archived", "Archived"],
            ["all", "All"]
          ]}
        />
        <Choices
          label="Sort"
          value={filters.sort}
          onChange={(sort) => setFilters({ ...filters, sort })}
          options={[
            ["name", "Name A–Z"],
            ["name_desc", "Name Z–A"],
            ["balance", "Largest balance"],
            ["newest", "Newest"]
          ]}
        />
      </FilterSheet>
    </Screen>
  );
}
