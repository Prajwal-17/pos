import type { ReactElement, ReactNode } from "react";
import { FlatList, Text, View } from "react-native";
import { AppButton } from "./app-button";
import { LoadState } from "./screen";

export function RecordList<T extends { id: string }>({
  list,
  renderItem,
  header
}: {
  list: {
    rows: T[];
    loading: boolean;
    error: string | null;
    retry: () => void;
    more: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    totalCount: number;
  };
  renderItem: (item: T) => ReactElement;
  header?: ReactNode;
}) {
  return (
    <FlatList
      data={list.rows}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderItem(item)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={
        <>
          {header}
          {list.totalCount > 0 && (
            <Text className="text-muted py-2 text-xs">
              {list.totalCount.toLocaleString("en-IN")} records
            </Text>
          )}
        </>
      }
      ItemSeparatorComponent={() => <View className="bg-border h-px" />}
      ListEmptyComponent={
        <LoadState loading={list.loading} error={list.error} retry={list.retry} />
      }
      ListFooterComponent={
        list.rows.length > 0 ? (
          <View className="pt-3">
            {list.error ? (
              <LoadState error={list.error} retry={list.retry} />
            ) : (
              list.hasMore && (
                <AppButton compact loading={list.loadingMore} variant="ghost" onPress={list.more}>
                  Load more
                </AppButton>
              )
            )}
          </View>
        ) : null
      }
      onEndReached={list.more}
      onEndReachedThreshold={0.4}
      initialNumToRender={12}
      windowSize={7}
    />
  );
}
