import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { RecordRow } from "@/components/ui/record-row";
import { Field, LoadState, Screen, SectionLabel } from "@/components/ui/screen";
import { TransactionList } from "@/features/transactions/transaction-list";
import { useDesktopQuery } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { balanceLabel, customerTypeLabel, recordDate } from "@/lib/format/records";
import { CustomerLedger } from "./customer-ledger";
import { getCustomerWorkspace } from "./customers.repository";
import { ledgerLabels } from "./ledger-row";

export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useDesktopQuery(["customer", id], (db) => getCustomerWorkspace(db, id));
  const [section, setSection] = useState("Ledger");
  const data = query.data;
  if (!data)
    return (
      <Screen title="Customer" back>
        <LoadState
          loading={query.loading}
          error={query.error}
          empty="Customer not found"
          retry={query.retry}
        />
      </Screen>
    );
  const { customer, ledger, summary } = data;
  return (
    <Screen title={customer.name} back>
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3">
        <View className="min-w-0 flex-1">
          <Text className="text-muted text-sm">
            {customerTypeLabel(customer.customerType)}
            {customer.isArchived ? " · Archived" : ""}
          </Text>
          {!!customer.contact && (
            <Text selectable className="text-ink mt-1 text-sm">
              {customer.contact}
            </Text>
          )}
        </View>
        <View className="items-end" style={{ maxWidth: "60%" }}>
          <Text className="text-muted text-xs">{balanceLabel(ledger.currentBalance)}</Text>
          <Text className="text-ink text-2xl font-semibold tabular-nums">
            {formatRupee(Math.abs(ledger.currentBalance))}
          </Text>
        </View>
      </View>
      <View className="border-border flex-row border-b px-2">
        {["Ledger", "Sales", "Estimates", "Details"].map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === tab }}
            aria-selected={section === tab}
            onPress={() => setSection(tab)}
            className={`min-h-12 flex-1 items-center justify-center border-b-2 ${section === tab ? "border-accent" : "border-transparent"}`}
          >
            <Text
              className={`text-sm font-semibold ${section === tab ? "text-accent" : "text-muted"}`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {section === "Ledger" ? (
        <CustomerLedger id={id} />
      ) : section === "Sales" ? (
        <TransactionList kind="sale" customerId={id} />
      ) : section === "Estimates" ? (
        <TransactionList kind="estimate" customerId={id} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <SectionLabel>Account</SectionLabel>
          <View className="rounded-control border-border bg-surface border px-3">
            <Field label="Total due" value={formatRupee(ledger.totalDue)} />
            <Field label="Total paid" value={formatRupee(ledger.totalPaid)} />
            <Field label="Opening balance" value={formatRupee(ledger.openingBalance)} />
            {ledger.lastPayment && (
              <Field
                label="Last payment"
                value={`${formatRupee(ledger.lastPayment.amount)} · ${recordDate(ledger.lastPayment.date)} · ${ledger.lastPayment.mode.toUpperCase()}`}
              />
            )}
            <Field label={`${summary.salesCount} sales`} value={formatRupee(summary.salesTotal)} />
            <Field
              label={`${summary.estimatesCount} estimates`}
              value={formatRupee(summary.estimatesTotal)}
            />
          </View>
          <SectionLabel>Details</SectionLabel>
          <Field label="Phone" value={customer.contact} />
          <Field label="Address" value={customer.address} />
          <Field label="Notes" value={customer.notes} />
          <Field label="Created" value={recordDate(customer.createdAt)} />
          <SectionLabel>Recent activity</SectionLabel>
          {data.activity.map((event) => (
            <View key={event.id} className="border-border border-b">
              <RecordRow
                title={`${ledgerLabels[event.kind] ?? event.kind}${event.documentNo ? ` #${event.documentNo}` : ""}`}
                meta={recordDate(event.date)}
                right={
                  <Text className="text-ink text-sm font-semibold tabular-nums">
                    {formatRupee(event.amount)}
                  </Text>
                }
                onPress={
                  event.documentId
                    ? () =>
                        router.push({
                          pathname: "/bill/[kind]/[id]",
                          params: { kind: event.kind, id: event.documentId! }
                        })
                    : undefined
                }
              />
              {!!event.notes && (
                <Text className="bg-surface text-muted px-3 pb-3 text-sm">{event.notes}</Text>
              )}
            </View>
          ))}
          {!data.activity.length && <Text className="text-muted py-4 text-sm">No activity</Text>}
        </ScrollView>
      )}
    </Screen>
  );
}
