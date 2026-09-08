import { Banknote, QrCode, Store } from "lucide-react-native";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import paths from "../../../../assets/payment-icons.json";
import { cn } from "@/lib/utils";

// Provider marks are bundled from Simple Icons; see assets/README.md.
const providers = {
  phonepe: { path: paths.phonepe, color: "#5F259F" },
  "google pay": { path: paths.googlepay, color: "#20231F" },
  paytm: { path: paths.paytm, color: "#002970" }
};

export function PaymentIcon({
  name,
  kind = "upi"
}: {
  name?: string;
  kind?: "cash" | "upi" | "vendor";
}) {
  const provider = providers[name?.toLowerCase() as keyof typeof providers];
  const Icon = kind === "cash" ? Banknote : kind === "vendor" ? Store : QrCode;
  return (
    <View
      accessible={false}
      className={cn(
        "rounded-control h-9 w-9 shrink-0 items-center justify-center",
        kind === "cash"
          ? "bg-sales-soft"
          : kind === "vendor"
            ? "bg-accent-soft"
            : "bg-surface-muted"
      )}
    >
      {provider && kind === "upi" ? (
        <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
          <Path d={provider.path} fill={provider.color} />
        </Svg>
      ) : (
        <Icon
          size={20}
          strokeWidth={1.8}
          color={kind === "cash" ? "#0B5C43" : kind === "vendor" ? "#76351F" : "#283129"}
        />
      )}
    </View>
  );
}
