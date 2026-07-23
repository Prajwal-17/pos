import { Button } from "@/components/ui/button";
import { ViewModal } from "@/features/dashboard/ViewModal";
import { DashboardCard } from "@/features/transactionDashboard/DashboardCard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import { useViewModalStore } from "@/store/viewModalStore";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { IndianRupee, Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ type }: { type: DashboardType }) => {
  const navigate = useNavigate();
  const { totalRevenue, totalTransactions } = useInfiniteScroll(type);
  const isSales = type === DASHBOARD_TYPE.SALES;

  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  return (
    <div className="bg-background flex h-full flex-1 flex-col overflow-hidden p-3">
      <DashboardCard
        commandLead={
          <>
            <div className="flex items-center gap-2">
              <span className="bg-success/15 text-success flex size-7 items-center justify-center rounded-[var(--radius-control)]">
                <IndianRupee className="size-3.5" />
              </span>
              <span className="text-muted-foreground text-xs font-medium">Revenue</span>
              <span className="financial-nums text-foreground text-base font-semibold">
                {formatRupee(totalRevenue ?? 0)}
              </span>
            </div>
            <div className="bg-border h-5 w-px" />
            <div className="flex items-center gap-2">
              <span className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-[var(--radius-control)]">
                <ShoppingCart className="size-3.5" />
              </span>
              <span className="text-muted-foreground text-xs font-medium">Transactions</span>
              <span className="financial-nums text-foreground text-base font-semibold">
                {totalTransactions}
              </span>
            </div>
          </>
        }
        commandAction={
          <Button
            size="compact"
            onClick={() =>
              navigate(isSales ? "/billing/sales/create" : "/billing/estimates/create")
            }
            className="hover:bg-primary-hover cursor-pointer gap-1.5 px-3"
          >
            <Plus className="size-4" />
            {isSales ? "New Sale" : "New Estimate"}
          </Button>
        }
      />
      {isViewModalOpen && <ViewModal type={type} id={transactionId} />}
    </div>
  );
};

export default Dashboard;
