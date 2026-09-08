import { useLocalSearchParams, useRouter } from "expo-router";
import { Share2 } from "lucide-react-native";
import { useRef, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { billHtml } from "./bill-html";
import { shareBill } from "./share-bill";
import { FlatList, Pressable, Text, View } from "react-native";
import { LoadState, Screen } from "@/components/ui/screen";
import { useDesktopQuery } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { quantity, recordDate } from "@/lib/format/records";
import { getBill, getStoreProfile } from "./transactions.repository";

export default function BillScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const router = useRouter();
  const valid = kind === "sale" || kind === "estimate";
  const query = useDesktopQuery(["bill", kind, id], (db) =>
    valid ? getBill(db, kind, id) : Promise.resolve(null)
  );
  const profile = useDesktopQuery(["store-profile"], getStoreProfile);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const busy = useRef(false);
  const bill = query.data;
  async function exportBill() {
    if (!bill || !profile.data || busy.current) return;
    busy.current = true;
    setSharing(true);
    setShareError(null);
    try {
      await shareBill(billHtml(bill, profile.data));
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "PDF could not be shared.");
    } finally {
      busy.current = false;
      setSharing(false);
    }
  }
  if (!bill)
    return (
      <Screen title={kind === "sale" ? "Sale" : "Estimate"} back>
        <LoadState
          loading={query.loading}
          error={query.error}
          empty="Bill not found"
          retry={query.retry}
        />
      </Screen>
    );
  const subtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
  return (
    <Screen
      title={`${bill.kind === "sale" ? "Sale" : "Estimate"} #${bill.transactionNo}`}
      back
      actions={
        <AppButton
          compact
          className="min-h-12"
          variant="outline"
          icon={Share2}
          accessibilityLabel="Share PDF"
          loading={sharing}
          disabled={!profile.data}
          onPress={() => void exportBill()}
        >
          PDF
        </AppButton>
      }
    >
      <FlatList
        data={bill.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="pb-3">
            {(shareError || profile.error || (!profile.loading && !profile.data)) && (
              <View className="py-2">
                <Text accessibilityRole="alert" className="text-destructive text-sm">
                  {shareError || profile.error || "Shop details unavailable"}
                </Text>
                {profile.error && (
                  <AppButton compact variant="ghost" onPress={profile.retry}>
                    Try again
                  </AppButton>
                )}
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open customer ${bill.customer.name}`}
              onPress={() =>
                router.push({ pathname: "/customer/[id]", params: { id: bill.customerId } })
              }
              className="min-h-12 justify-center py-2"
            >
              <Text className="text-ink text-lg font-semibold">{bill.customer.name}</Text>
              {!!bill.customer.contact && (
                <Text className="text-muted mt-1 text-sm">{bill.customer.contact}</Text>
              )}
            </Pressable>
            <Text className="text-muted text-xs">
              {recordDate(bill.createdAt, true)}
              {bill.inLedger ? " · In ledger" : ""}
            </Text>
            <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-muted text-sm">
                {bill.items.length} items · Qty {quantity(bill.totalQuantity)}
              </Text>
              <Text className="text-ink text-2xl font-semibold tabular-nums">
                {formatRupee(bill.grandTotal)}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="border-border bg-surface border-b px-3 py-3">
            <View className="flex-row items-start gap-2">
              <Text className="text-muted mt-0.5 w-5 text-xs">{index + 1}</Text>
              <Pressable
                disabled={!item.productId}
                accessibilityRole={item.productId ? "button" : "text"}
                accessibilityLabel={`View product ${item.productSnapshot}`}
                onPress={() =>
                  router.push({ pathname: "/product/[id]", params: { id: item.productId! } })
                }
                className="min-h-12 min-w-0 flex-1 justify-center"
              >
                <Text className="text-ink text-base leading-6 font-medium">
                  {item.productSnapshot}
                </Text>
              </Pressable>
            </View>
            <View className="mt-1 flex-row flex-wrap justify-between gap-2 pl-7">
              <Text className="text-muted text-sm tabular-nums">
                {quantity(item.quantity)} × {formatRupee(item.price)}
              </Text>
              <Text className="text-ink text-base font-semibold tabular-nums">
                {formatRupee(item.totalPrice)}
              </Text>
            </View>
            {item.checkedQty > 0 && (
              <Text className="text-sales-ink mt-1 pl-7 text-xs">
                Checked {quantity(item.checkedQty)} / {quantity(item.quantity)}
              </Text>
            )}
          </View>
        )}
        ListFooterComponent={
          <View className="pt-4">
            <View className="rounded-control border-border bg-surface gap-3 border p-3">
              {[
                ["Subtotal", subtotal],
                ["Rounding", bill.grandTotal - subtotal],
                ["Total", bill.grandTotal]
              ].map(([label, value]) => (
                <View key={label} className="flex-row flex-wrap justify-between gap-2">
                  <Text
                    className={
                      label === "Total" ? "text-ink text-base font-semibold" : "text-muted text-sm"
                    }
                  >
                    {label}
                  </Text>
                  <Text className="text-ink text-base font-semibold tabular-nums">
                    {formatRupee(value as number)}
                  </Text>
                </View>
              ))}
            </View>
            {!!bill.notes && (
              <View className="pt-4">
                <Text className="text-muted mb-1 text-xs">Notes</Text>
                <Text selectable className="text-ink text-base leading-6">
                  {bill.notes}
                </Text>
              </View>
            )}
          </View>
        }
      />
    </Screen>
  );
}
