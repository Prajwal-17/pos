import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { sortOptions } from "@/constants";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import type { SortType } from "@shared/types";
import type { ReactNode } from "react";
import { DashboardTable } from "./DashboardTable";
import { DateRangePicker } from "./DateRangePicker";

type DashboardCardProps = {
  commandLead?: ReactNode;
  commandAction?: ReactNode;
};

export const DashboardCard = ({ commandLead, commandAction }: DashboardCardProps) => {
  const { sortBy, setSortBy } = useDashboard();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="border-border bg-card flex min-h-11 shrink-0 items-center gap-3 rounded-[var(--radius-panel)] border px-3 py-1.5">
        {commandLead && <div className="flex min-w-0 items-center gap-5">{commandLead}</div>}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Sort</span>
          <Select
            value={sortBy}
            defaultValue={sortBy}
            onValueChange={(value: SortType) => setSortBy(value)}
          >
            <SelectTrigger className="text-foreground h-8 w-48 cursor-pointer text-sm font-medium">
              <SelectValue placeholder="Date (Newest First)" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Icon className="text-muted-foreground size-4" />
                      {option.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <DateRangePicker />
          {commandAction}
        </div>
      </div>
      <DashboardTable />
    </div>
  );
};
