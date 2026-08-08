import { Badge } from "@/components/ui/badge";
import {
  CompactCard as Card,
  CompactCardContent as CardContent
} from "@/components/app-ui/compact-card";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/features/transactions/store/dashboard.store";
import { TREND_OPTION, type TrendType } from "@shared/types";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  label: string;
  value: string;
  changePercent: number;
  href: string;
  trend: TrendType;
}

export function MetricCard({ label, value, changePercent, href, trend }: MetricCardProps) {
  const navigate = useNavigate();
  const setDate = useDashboardStore((state) => state.setDate);
  const isPositive = typeof changePercent === "number" ? changePercent >= 0 : undefined;

  const formattedChange =
    typeof changePercent === "number"
      ? `${changePercent > 0 ? "+" : changePercent < 0 ? "-" : ""}${Math.abs(changePercent)}%`
      : undefined;

  const handleLink = async () => {
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(fromDate.getDate());
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const parsedDate = JSON.stringify({ from: fromDate, to: toDate });
    localStorage.setItem("daterange", JSON.stringify(parsedDate));
    setDate({ from: fromDate, to: toDate });
    navigate(href);
  };

  return (
    <Card className="border-border bg-card border py-2">
      <CardContent className="px-3 py-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm leading-5 font-medium">
              {label}
            </span>
          </div>

          {href ? (
            <div
              onClick={handleLink}
              className="bg-secondary text-foreground/70 border-border hover:bg-surface-3 hover:text-foreground inline-flex items-center justify-center rounded-(--radius-control) border p-1 transition-colors"
            >
              <ArrowUpRight size={18} />
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          <div className="financial-nums text-foreground text-xl font-semibold tracking-tight">
            {value}
          </div>
        </div>

        {trend !== TREND_OPTION.NO_CHANGE && (
          <div className="mt-1.5 flex items-center gap-2">
            {formattedChange ? (
              <Badge
                variant="secondary"
                className={cn(
                  "px-2 py-0.5 text-xs",
                  typeof isPositive === "boolean"
                    ? isPositive
                      ? "bg-success-surface text-success border-success-border"
                      : "bg-destructive-surface text-destructive border-destructive-border"
                    : ""
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-3.5!" />
                ) : (
                  <TrendingDown className="size-3.5!" />
                )}
                {formattedChange}
              </Badge>
            ) : null}

            <span className="text-muted-foreground text-xs leading-5 font-medium">
              vs Yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
