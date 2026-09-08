import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  buildCalendarMonth,
  getTodayIST,
  monthFromDate,
  monthLabel,
  shiftMonth
} from "@/lib/format/dates";
import { periodNames, type DateRange, type Period } from "@/lib/format/records";
import { Choices } from "./filter-sheet";
import { IconButton } from "./icon-button";

export function DateRangeField({
  value,
  onChange
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const today = getTodayIST();
  const [month, setMonth] = useState(() => monthFromDate(value.from ?? today));
  const [edge, setEdge] = useState<"from" | "to">("from");
  return (
    <View>
      <Choices
        label="Period"
        value={value.period}
        options={Object.entries(periodNames) as [Period, string][]}
        onChange={(period) =>
          onChange({
            period,
            ...(period === "custom" ? { from: value.from ?? today, to: value.to ?? today } : {})
          })
        }
      />
      {value.period === "custom" && (
        <View className="rounded-control border-border bg-surface mb-4 border p-2">
          <View className="flex-row gap-2">
            {(["from", "to"] as const).map((side) => (
              <Pressable
                key={side}
                accessibilityRole="button"
                accessibilityLabel={`Select ${side} date`}
                onPress={() => {
                  setEdge(side);
                  setMonth(monthFromDate(value[side] ?? today));
                }}
                className={`rounded-control min-h-12 flex-1 p-2 ${edge === side ? "bg-accent-soft" : "bg-canvas"}`}
              >
                <Text className="text-muted text-xs">{side === "from" ? "From" : "To"}</Text>
                <Text className="text-ink text-sm font-semibold">{value[side]}</Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row items-center justify-between py-2">
            <IconButton
              icon={ChevronLeft}
              label="Previous month"
              onPress={() => setMonth(shiftMonth(month, -1))}
            />
            <Text className="text-ink text-base font-semibold">{monthLabel(month)}</Text>
            <IconButton
              icon={ChevronRight}
              label="Next month"
              disabled={monthLabel(month) === monthLabel(monthFromDate(today))}
              onPress={() => setMonth(shiftMonth(month, 1))}
            />
          </View>
          <View className="flex-row">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <Text
                key={index}
                style={{ width: "14.2857%" }}
                className="text-muted text-center text-xs"
              >
                {day}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {buildCalendarMonth(month).map((cell, index) => (
              <View key={index} style={{ width: "14.2857%" }}>
                {cell && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${cell.date}`}
                    disabled={cell.date > today}
                    onPress={() => {
                      const from = edge === "from" ? cell.date : (value.from ?? cell.date);
                      const to = edge === "to" ? cell.date : (value.to ?? cell.date);
                      onChange({
                        period: "custom",
                        from: from > to ? cell.date : from,
                        to: from > to ? cell.date : to
                      });
                      if (edge === "from") setEdge("to");
                    }}
                    className={`rounded-control min-h-11 items-center justify-center ${cell.date === value.from || cell.date === value.to ? "bg-primary" : cell.date > (value.from ?? today) && cell.date < (value.to ?? today) ? "bg-accent-soft" : ""} ${cell.date > today ? "opacity-30" : ""}`}
                  >
                    <Text
                      className={`text-sm ${cell.date === value.from || cell.date === value.to ? "text-white" : "text-ink"}`}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
