import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Choices, FilterButton, FilterSheet } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { RecordRow } from "@/components/ui/record-row";
import { Screen } from "@/components/ui/screen";
import { SearchField, useSearch } from "@/components/ui/search-field";
import { useDesktopList } from "@/lib/db/use-desktop-query";
import { formatRupee } from "@/lib/format/money";
import { productMeta } from "./products.presentation";
import { listProducts } from "./products.repository";
import type { ProductFilters } from "./products.types";

export default function ProductsScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const search = useSearch(text);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Omit<ProductFilters, "search">>({
    status: "active",
    sort: "name"
  });
  const list = useDesktopList(["products", search, filters], (db, page) =>
    listProducts(db, { ...filters, search }, page)
  );
  return (
    <Screen
      title="Products"
      actions={
        <FilterButton
          onPress={() => setOpen(true)}
          active={filters.status !== "active" || filters.sort !== "name"}
        />
      }
    >
      <View className="px-4 pb-2">
        <SearchField value={text} onChange={setText} label="Search products" />
      </View>
      <RecordList
        list={list}
        renderItem={(product) => (
          <RecordRow
            title={product.name}
            meta={productMeta(product)}
            right={
              <Text className="text-ink text-base font-semibold tabular-nums">
                {formatRupee(product.price)}
              </Text>
            }
            label={`Open product ${product.productSnapshot}`}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
          />
        )}
      />
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <Choices
          label="Status"
          value={filters.status}
          onChange={(status) => setFilters({ ...filters, status })}
          options={[
            ["active", "Active"],
            ["inactive", "Inactive"],
            ["deleted", "Deleted"],
            ["all", "All"]
          ]}
        />
        <Choices
          label="Sort"
          value={filters.sort}
          onChange={(sort) => setFilters({ ...filters, sort })}
          options={[
            ["name", "Name A–Z"],
            ["name_desc", "Name Z–A"],
            ["price_low", "Price low to high"],
            ["price_high", "Price high to low"],
            ["mrp_low", "MRP low to high"],
            ["mrp_high", "MRP high to low"]
          ]}
        />
      </FilterSheet>
    </Screen>
  );
}
