import { useRouter } from "expo-router";
import { ArrowLeftRight, Banknote, Receipt, Wallet, WalletCards } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { formatRupee } from "@/lib/format/money";
import { balanceLabel, recordDate } from "@/lib/format/records";
import type { LedgerEntry } from "./customers.types";

export const ledgerLabels: Record<string, string> = {
  sale: "Sale",
  quick_sale: "Quick sale",
  payment: "Payment",
  adjustment: "Adjustment",
  opening_balance: "Opening balance",
  estimate: "Estimate"
};
const identities = {
  sale: { Icon: Receipt, backgroundColor: "#E3F5EF", color: "#0B5C43" },
  quick_sale: { Icon: Banknote, backgroundColor: "#FBE9E1", color: "#76351F" },
  payment: { Icon: WalletCards, backgroundColor: "#F8E9EE", color: "#6F263E" },
  adjustment: { Icon: ArrowLeftRight, backgroundColor: "#FFF0C7", color: "#754300" },
  opening_balance: { Icon: Wallet, backgroundColor: "#D4E6AD", color: "#3F521B" }
};
export function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const router = useRouter();
  const { Icon, backgroundColor, color } = identities[entry.type] ?? identities.adjustment;
  const content = (
    <>
      <View className="flex-row items-center gap-2">
        <View
          style={{ backgroundColor }}
          className="h-8 w-8 items-center justify-center rounded-lg"
        >
          <Icon size={17} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-ink text-sm font-semibold">
            {ledgerLabels[entry.type] ?? entry.type}
            {entry.invoiceNo ? ` #${entry.invoiceNo}` : ""}
          </Text>
          <Text className="text-muted mt-0.5 text-xs">
            {recordDate(entry.createdAt)}
            {entry.paymentMode ? ` · ${entry.paymentMode.toUpperCase()}` : ""}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-x-5 gap-y-1">
        {entry.amountDue !== 0 && (
          <View>
            <Text className="text-muted text-xs">Due</Text>
            <Text className="text-ink text-base font-semibold tabular-nums">
              {formatRupee(entry.amountDue)}
            </Text>
          </View>
        )}
        {entry.amountPaid !== 0 && (
          <View>
            <Text className="text-muted text-xs">Paid</Text>
            <Text className="text-ink text-base font-semibold tabular-nums">
              {formatRupee(entry.amountPaid)}
            </Text>
          </View>
        )}
        <View className="ml-auto items-end">
          <Text className="text-muted text-xs">Balance · {balanceLabel(entry.runningBalance)}</Text>
          <Text className="text-ink text-base tabular-nums">
            {formatRupee(Math.abs(entry.runningBalance))}
          </Text>
        </View>
      </View>
      {!!entry.notes && <Text className="text-muted mt-2 text-sm leading-5">{entry.notes}</Text>}
    </>
  );
  return entry.saleId ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open sale ${entry.invoiceNo ?? ""}`}
      onPress={() =>
        router.push({ pathname: "/bill/[kind]/[id]", params: { kind: "sale", id: entry.saleId! } })
      }
      className="bg-surface p-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      {content}
    </Pressable>
  ) : (
    <View className="bg-surface p-3">{content}</View>
  );
}
