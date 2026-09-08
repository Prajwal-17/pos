import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Choices, FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { RecordRow } from "@/components/ui/record-row";
import { Field, LoadState, Screen } from "@/components/ui/screen";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { useDesktopList, useDesktopQuery } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { quantity, recordDate } from "@/lib/format/records";
import { getProduct, productBills, productPrices } from "./products.repository";
import { productMeta } from "./products.presentation";
import type { ProductBillFilters } from "./products.types";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useDesktopQuery(["product", id], (db) => getProduct(db, id));
  const [section, setSection] = useState("Details");
  const product = query.data;
  if (!product)
    return (
      <Screen title="Product" back>
        <LoadState
          loading={query.loading}
          error={query.error}
          empty="Product not found"
          retry={query.retry}
        />
      </Screen>
    );
  return (
    <Screen title={product.name} back>
      <View className="gap-2 px-4 pb-3">
        <Text className="text-muted text-sm">{productMeta(product)}</Text>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted text-sm">Selling price</Text>
          <Text className="text-ink text-2xl font-semibold tabular-nums">
            {formatRupee(product.price)}
          </Text>
        </View>
      </View>
      <View className="border-border flex-row border-b px-2">
        {["Details", "Prices", "Bills"].map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            aria-selected={section === tab}
            accessibilityState={{ selected: section === tab }}
            onPress={() => setSection(tab)}
            className={`min-h-12 flex-1 items-center justify-center border-b-2 ${section === tab ? "border-accent" : "border-transparent"}`}
          >
            <Text
              className={`text-sm font-semibold ${section === tab ? "text-accent" : "text-muted"}`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {section === "Prices" ? (
        <PriceHistory id={id} />
      ) : section === "Bills" ? (
        <ProductHistory id={id} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Field label="Name / variant" value={product.productSnapshot} />
          <Field
            label="Purchase price"
            value={product.purchasePrice == null ? "—" : formatRupee(product.purchasePrice)}
          />
          <Field label="MRP" value={product.mrp == null ? "—" : formatRupee(product.mrp)} />
          <Field
            label="Unit / weight"
            value={[product.weight, product.unit].filter(Boolean).join(" ")}
          />
          <Field
            label="Total quantity · sales and estimates"
            value={quantity(product.totalQuantitySold)}
          />
          <Field label="Last billed" value={recordDate(product.lastSoldAt)} />
          <Field label="Created" value={recordDate(product.createdAt)} />
          <Field label="Updated" value={recordDate(product.updatedAt)} />
        </ScrollView>
      )}
    </Screen>
  );
}
function PriceHistory({ id }: { id: string }) {
  const list = useDesktopList(["product-prices", id], (db, page) => productPrices(db, id, page));
  const price = (value: number | null) => (value == null ? "—" : formatRupee(value));
  return (
    <RecordList
      list={list}
      renderItem={(change) => (
        <View className="bg-surface p-3">
          <Text className="text-ink text-sm font-semibold">
            {recordDate(change.createdAt, true)}
          </Text>
          <Text className="text-muted mt-1 text-xs">
            {[change.name, change.weight, change.unit].filter(Boolean).join(" ")}
          </Text>
          {[
            ["Selling", change.oldPrice, change.newPrice],
            ["Purchase", change.oldPurchasePrice, change.newPurchasePrice],
            ["MRP", change.oldMrp, change.newMrp]
          ].map(([label, oldValue, newValue]) => (
            <View key={label} className="mt-2 flex-row flex-wrap justify-between gap-2">
              <Text className="text-muted text-sm">{label}</Text>
              <Text className="text-ink text-sm tabular-nums">
                {price(oldValue as number | null)} → {price(newValue as number | null)}
              </Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}
function ProductHistory({ id }: { id: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const search = useSearch(text);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Omit<ProductBillFilters, "search">>({
    kind: "all",
    range: { period: "all" }
  });
  const list = useDesktopList(["product-bills", id, search, filters], (db, page) =>
    productBills(db, id, { ...filters, search }, page)
  );
  return (
    <View className="flex-1">
      <View className="flex-row gap-2 px-4 pt-3">
        <View className="flex-1">
          <SearchField label="Search product bills" value={text} onChange={setText} />
        </View>
        <FilterButton
          onPress={() => setOpen(true)}
          active={filters.kind !== "all" || filters.range.period !== "all"}
        />
      </View>
      <RecordList
        list={list}
        renderItem={(bill) => (
          <RecordRow
            title={bill.customerName}
            meta={`${bill.kind === "sale" ? "Sale" : "Estimate"} #${bill.number} · ${recordDate(bill.createdAt)}`}
            right={
              <Text className="text-ink text-base font-semibold tabular-nums">
                {formatRupee(bill.totalPrice)}
              </Text>
            }
            label={`Open ${bill.kind} ${bill.number}`}
            onPress={() =>
              router.push({
                pathname: "/bill/[kind]/[id]",
                params: { kind: bill.kind, id: bill.billId }
              })
            }
          >
            <Text className="text-muted mt-2 text-sm tabular-nums">
              {quantity(bill.quantity)} × {formatRupee(bill.price)}
            </Text>
          </RecordRow>
        )}
      />
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <Choices
          label="Document"
          value={filters.kind}
          onChange={(kind) => setFilters({ ...filters, kind })}
          options={[
            ["all", "All"],
            ["sale", "Sales"],
            ["estimate", "Estimates"]
          ]}
        />
        <DateRangeField
          value={filters.range}
          onChange={(range) => setFilters({ ...filters, range })}
        />
      </FilterSheet>
    </View>
  );
}
