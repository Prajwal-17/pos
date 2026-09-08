import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { buildCalendarMonth, isFutureDate, monthLabel, type LedgerMonth } from "@/lib/format/dates";
import type { DaySummary, LocalDate } from "@/features/money/money.types";
import { formatCompactRupee } from "@/lib/format/money";
import { cn } from "@/lib/utils";

import { IconButton } from "@/components/ui/icon-button";
import { LedgerCard } from "@/components/ui/ledger-card";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface MonthCalendarProps {
  month: LedgerMonth;
  selectedDate: LocalDate;
  today: LocalDate;
  summaries: Map<LocalDate, DaySummary>;
  loading?: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: LocalDate) => void;
}

export function MonthCalendar({
  month,
  selectedDate,
  today,
  summaries,
  loading,
  onPreviousMonth,
  onNextMonth,
  onSelectDate
}: MonthCalendarProps) {
  const cells = buildCalendarMonth(month);

  return (
    <LedgerCard>
      <View className="border-border flex-row items-center justify-between border-b px-3 py-3">
        <IconButton icon={ChevronLeft} label="Previous month" onPress={onPreviousMonth} />
        <View className="items-center">
          <Text className="text-ink text-xl font-semibold">{monthLabel(month)}</Text>
          <Text className="text-muted mt-0.5 text-[11px] font-medium tracking-widest">
            {loading ? "UPDATING LEDGER" : "DAILY RECEIPTS"}
          </Text>
        </View>
        <IconButton
          disabled={
            month.year > Number(today.slice(0, 4)) ||
            (month.year === Number(today.slice(0, 4)) &&
              month.month >= Number(today.slice(5, 7)) - 1)
          }
          icon={ChevronRight}
          label="Next month"
          onPress={onNextMonth}
        />
      </View>

      <View className="px-2 pb-2 pt-3">
        <View className="mb-1 flex-row">
          {WEEKDAYS.map((weekday, index) => (
            <View
              key={`${weekday}-${index}`}
              className="items-center"
              style={{ width: "14.2857%" }}
            >
              <Text className="text-muted text-[11px] font-semibold">{weekday}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <View
                  key={`blank-${index}`}
                  className="min-h-[58px]"
                  style={{ width: "14.2857%" }}
                />
              );
            }

            const summary = summaries.get(cell.date);
            const selected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const disabled = isFutureDate(cell.date);

            return (
              <View key={cell.date} className="p-0.5" style={{ width: "14.2857%" }}>
                <Pressable
                  accessibilityLabel={`${cell.day}, ${monthLabel(month)}${summary ? `, received ${formatCompactRupee(summary.receivedPaisa)}` : ", no entry"}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  disabled={disabled}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    onSelectDate(cell.date);
                  }}
                  className={cn(
                    "rounded-control min-h-[56px] items-center justify-center border",
                    selected
                      ? "border-primary bg-primary"
                      : summary
                        ? "border-border bg-sales-soft"
                        : "border-transparent bg-transparent",
                    disabled && "opacity-40"
                  )}
                  style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.72 : 1 })}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      selected ? "text-white" : "text-ink",
                      isToday && !selected && "text-accent"
                    )}
                  >
                    {cell.day}
                  </Text>
                  {summary ? (
                    <Text
                      className={cn(
                        "mt-0.5 text-[10px] font-bold",
                        selected ? "text-white" : "text-sales-ink"
                      )}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatCompactRupee(summary.receivedPaisa)}
                    </Text>
                  ) : isToday ? (
                    <View
                      className={cn(
                        "mt-1 h-1 w-1 rounded-full",
                        selected ? "bg-white" : "bg-accent"
                      )}
                    />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </LedgerCard>
  );
}
