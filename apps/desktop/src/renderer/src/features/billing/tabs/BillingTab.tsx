import { cn } from "@/lib/utils";
import type { BillingTabType } from "@/features/billing/store/billingTabs.store";
import { TRANSACTION_TYPE } from "@shared/types";
import { X } from "lucide-react";

const getTabLabel = (tab: BillingTabType): string => {
  if (tab.transactionNo) {
    return tab.type === TRANSACTION_TYPE.SALE
      ? "Sale #" + tab.transactionNo
      : "Estimate #" + tab.transactionNo;
  }
  return tab.type === TRANSACTION_TYPE.SALE ? "New Sale" : "New Estimate";
};

export const BillingTab = ({
  tab,
  isActive,
  onSelect,
  onClose
}: {
  tab: BillingTabType;
  isActive: boolean;
  onSelect: () => void;
  onClose: (event: React.MouseEvent) => void;
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group focus-visible:ring-ring relative flex h-9 cursor-pointer items-center gap-2 rounded-t-[var(--radius-control)] border-x border-t border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
        isActive
          ? "border-frame bg-card text-foreground"
          : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
      )}
    >
      <span className="bg-selection-border size-2 shrink-0 rounded-full" />
      <span className="max-w-32 truncate">{getTabLabel(tab)}</span>
      <span
        role="button"
        tabIndex={-1}
        onClick={onClose}
        className="hover:bg-foreground/10 flex size-5 shrink-0 items-center justify-center rounded-sm"
      >
        <X className="size-3.5" />
      </span>
      {isActive && (
        <span className="bg-selection-border absolute right-0 bottom-0 left-0 h-0.5" />
      )}
    </button>
  );
};
