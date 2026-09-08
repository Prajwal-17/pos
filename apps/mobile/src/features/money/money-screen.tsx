import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { confirmAction } from "@/lib/confirm-action";
import { AppButton } from "@/components/ui/app-button";
import { DayTotals } from "@/features/money/components/day-totals";
import { IconButton } from "@/components/ui/icon-button";
import { LedgerCard } from "@/components/ui/ledger-card";
import { MonthCalendar } from "@/features/money/components/month-calendar";
import { PaymentIcon } from "@/features/money/components/payment-icon";
import {
  formatDisplayDate,
  getTodayIST,
  isFutureDate,
  isSameMonth,
  monthFromDate,
  shiftMonth,
  type LedgerMonth
} from "@/lib/format/dates";
import {
  deleteDailyEntry,
  getDailyEntry,
  listMonthSummaries
} from "@/features/money/money.repository";
import {
  summarizeEntry,
  type DailyEntry,
  type DaySummary,
  type LocalDate
} from "@/features/money/money.types";
import { formatRupee } from "@/lib/format/money";

export default function MoneyScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const today = getTodayIST();
  const [month, setMonth] = useState<LedgerMonth>(() => monthFromDate(today));
  const [selectedDate, setSelectedDate] = useState<LocalDate>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestId = useRef(0);

  const loadLedger = useCallback(
    async (showRefresh = false) => {
      const request = ++requestId.current;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [monthRows, selectedEntry] = await Promise.all([
          listMonthSummaries(db, month),
          getDailyEntry(db, selectedDate)
        ]);
        if (request !== requestId.current) return;
        setSummaries(monthRows);
        setEntry(selectedEntry);
      } catch (loadError) {
        if (request === requestId.current)
          setError(loadError instanceof Error ? loadError.message : "Could not read the ledger.");
      } finally {
        if (request === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [db, month, selectedDate]
  );

  useFocusEffect(
    useCallback(() => {
      void loadLedger();
      return () => {
        requestId.current += 1;
      };
    }, [loadLedger])
  );

  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.date, summary])),
    [summaries]
  );
  const selectedSummary = entry ? summarizeEntry(entry) : null;

  function changeMonth(amount: number) {
    const nextMonth = shiftMonth(month, amount);
    setMonth(nextMonth);
    setSelectedDate(
      isSameMonth(today, nextMonth)
        ? today
        : (`${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-01` as LocalDate)
    );
  }

  function changeDay(amount: number) {
    const shifted = new Date(`${selectedDate}T12:00:00Z`);
    shifted.setUTCDate(shifted.getUTCDate() + amount);
    const date = shifted.toISOString().slice(0, 10) as LocalDate;
    if (isFutureDate(date)) return;
    setSelectedDate(date);
    setMonth(monthFromDate(date));
  }

  function openEditor() {
    if (isFutureDate(selectedDate)) return;
    router.push({ pathname: "/entry", params: { date: selectedDate } });
  }

  function confirmDelete() {
    if (!entry || !selectedSummary) return;
    confirmAction(
      "Delete this day's record?",
      `${formatDisplayDate(entry.date)}\nReceived ${formatRupee(selectedSummary.receivedPaisa)} · Paid ${formatRupee(selectedSummary.paidPaisa)}\n\nThis cannot be undone.`,
      "Delete",
      () => {
        setDeleting(true);
        void deleteDailyEntry(db, entry.date)
          .then(() => loadLedger())
          .catch((deleteError) => {
            setError(
              deleteError instanceof Error ? deleteError.message : "Could not delete this record."
            );
          })
          .finally(() => setDeleting(false));
      }
    );
  }

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-4 pb-5 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadLedger(true)}
            colors={["#B6532B"]}
            tintColor="#B6532B"
          />
        }
      >
        <View className="w-full max-w-xl gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View className="flex-row items-center gap-3">
              <IconButton
                icon={ArrowLeft}
                label="Back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              />
              <Text
                accessibilityRole="header"
                className="text-ink text-xl font-semibold tracking-tight"
              >
                Money
              </Text>
            </View>
            <AppButton
              compact
              icon={CalendarDays}
              variant="outline"
              accessibilityState={{ expanded: calendarOpen }}
              onPress={() => setCalendarOpen(!calendarOpen)}
            >
              {calendarOpen ? "Close history" : "History"}
            </AppButton>
          </View>

          {calendarOpen ? (
            <MonthCalendar
              month={month}
              selectedDate={selectedDate}
              today={today}
              summaries={summaryMap}
              loading={loading}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCalendarOpen(false);
              }}
            />
          ) : null}

          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <IconButton icon={ChevronLeft} label="Previous day" onPress={() => changeDay(-1)} />
              <View className="min-w-0 flex-1 items-center">
                <Text className="text-accent text-xs font-semibold">
                  {selectedDate === today ? "TODAY" : "DAILY RECORD"}
                </Text>
                <Text className="text-ink mt-1 text-center text-sm font-medium">
                  {formatDisplayDate(selectedDate)}
                </Text>
              </View>
              <IconButton
                icon={ChevronRight}
                label="Next day"
                disabled={selectedDate >= today}
                onPress={() => changeDay(1)}
              />
            </View>
            {selectedDate !== today ? (
              <AppButton
                compact
                variant="ghost"
                onPress={() => {
                  setSelectedDate(today);
                  setMonth(monthFromDate(today));
                }}
              >
                Back to today
              </AppButton>
            ) : null}
          </View>

          {loading ? (
            <LedgerCard className="min-h-40 items-center justify-center gap-3 p-6">
              <ActivityIndicator color="#B6532B" />
              <Text className="text-muted text-sm">Loading…</Text>
            </LedgerCard>
          ) : error ? (
            <LedgerCard className="gap-4 p-5">
              <Text accessibilityRole="alert" className="text-destructive text-base">
                {error}
              </Text>
              <AppButton variant="outline" onPress={() => void loadLedger()}>
                Try again
              </AppButton>
            </LedgerCard>
          ) : entry && selectedSummary ? (
            <>
              <LedgerCard className="p-4">
                <View className="mb-3 flex-row items-center gap-1.5">
                  <Check size={16} color="#0B5C43" />
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-sales-ink text-sm font-medium"
                  >
                    Saved
                  </Text>
                </View>
                <DayTotals
                  received={selectedSummary.receivedPaisa}
                  paid={selectedSummary.paidPaisa}
                />
              </LedgerCard>
              <AppButton icon={Pencil} onPress={openEditor} disabled={deleting}>
                Edit record
              </AppButton>
              <DayDetails entry={entry} />
              <AppButton
                compact
                icon={Trash2}
                loading={deleting}
                variant="ghost"
                onPress={confirmDelete}
              >
                Delete record
              </AppButton>
            </>
          ) : (
            <LedgerCard>
              <View className="gap-3 p-4">
                <EmptyRow kind="cash" title="Cash received" />
                <EmptyRow kind="upi" title="UPI & online" />
                <EmptyRow kind="vendor" title="Vendor payments" />
              </View>
              <View className="px-4 pb-4">
                <AppButton icon={Plus} onPress={openEditor}>
                  Add record
                </AppButton>
              </View>
            </LedgerCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyRow({ kind, title }: { kind: "cash" | "upi" | "vendor"; title: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <PaymentIcon kind={kind} />
      <Text className="text-ink flex-1 text-base font-medium">{title}</Text>
      <Text className="text-muted text-lg">—</Text>
    </View>
  );
}

function DayDetails({ entry }: { entry: DailyEntry }) {
  return (
    <View className="gap-3">
      <View className="gap-3">
        <Text className="text-ink text-base font-semibold">Received</Text>
        <LedgerCard>
          <MoneyRow name="Cash" kind="cash" amount={entry.cashPaisa} />
          {entry.onlineReceipts.map((receipt) => (
            <MoneyRow
              key={receipt.channelId}
              name={receipt.channelName}
              amount={receipt.amountPaisa}
            />
          ))}
        </LedgerCard>
      </View>
      <View className="gap-3">
        <Text className="text-ink text-base font-semibold">
          Vendor payments · {entry.supplierPayments.length}
        </Text>
        {entry.supplierPayments.length ? (
          <LedgerCard>
            {entry.supplierPayments.map((payment) => (
              <MoneyRow
                key={payment.id}
                name={payment.payee}
                kind="vendor"
                amount={payment.amountPaisa}
                note={payment.note}
              />
            ))}
          </LedgerCard>
        ) : (
          <Text className="text-muted text-sm">No payments</Text>
        )}
      </View>
    </View>
  );
}

function MoneyRow({
  name,
  amount,
  kind = "upi",
  note
}: {
  name: string;
  amount: number;
  kind?: "cash" | "upi" | "vendor";
  note?: string | null;
}) {
  return (
    <View className="border-border flex-row items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
      <PaymentIcon name={name} kind={kind} />
      <View className="min-w-0 flex-1">
        <Text className="text-ink text-sm font-medium">{name}</Text>
        {note ? <Text className="text-muted mt-1 text-sm">{note}</Text> : null}
      </View>
      <Text className="text-ink max-w-[55%] text-right text-base font-semibold tabular-nums">
        {formatRupee(amount)}
      </Text>
    </View>
  );
}
