import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { RecordList } from "@/components/ui/record-list";
import { RecordRow } from "@/components/ui/record-row";
import { Screen } from "@/components/ui/screen";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { listCustomers } from "@/features/customers/customers.repository";
import { useDesktopList } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { customerTypeLabel } from "@/lib/format/records";
export default function BalancesScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const balance = kind === "advance" ? "advance" : "due";
  const router = useRouter();
  const [text, setText] = useState("");
  const search = useSearch(text);
  const list = useDesktopList(["balances", balance, search], (db, page) =>
    listCustomers(db, { search, type: "all", balance, archived: "all", sort: "balance" }, page)
  );
  return (
    <Screen title={balance === "due" ? "Customer dues" : "Customer advances"} back>
      <View className="px-4 pb-2">
        <SearchField label="Search balances" value={text} onChange={setText} />
      </View>
      <RecordList
        list={list}
        renderItem={(customer) => (
          <RecordRow
            title={customer.name}
            meta={[
              customerTypeLabel(customer.customerType),
              customer.isArchived ? "Archived" : null
            ]
              .filter(Boolean)
              .join(" · ")}
            right={
              <Text className="text-ink text-base font-semibold tabular-nums">
                {formatRupee(Math.abs(customer.outstandingBalance ?? 0))}
              </Text>
            }
            label={`Open customer ${customer.name}`}
            onPress={() => router.push({ pathname: "/customer/[id]", params: { id: customer.id } })}
          />
        )}
      />
    </Screen>
  );
}
