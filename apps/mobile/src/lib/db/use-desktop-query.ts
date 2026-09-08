import { useInfiniteQuery, useQuery, type QueryKey } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import { useDesktopDatabase } from "./desktop-database";
import type { Page } from "./read";

export function useDesktopQuery<T>(key: QueryKey, read: (db: SQLiteDatabase) => Promise<T>) {
  const source = useDesktopDatabase();
  const query = useQuery({
    queryKey: ["desktop", ...key],
    queryFn: () => read(source.db!),
    enabled: !!source.db
  });
  return {
    data: query.data ?? null,
    loading: !source.error && query.isPending,
    error: source.error || query.error?.message || null,
    retry: () => (source.error ? source.retry() : void query.refetch())
  };
}

export function useDesktopList<T>(
  key: QueryKey,
  read: (db: SQLiteDatabase, page: number) => Promise<Page<T>>
) {
  const source = useDesktopDatabase();
  const query = useInfiniteQuery({
    queryKey: ["desktop", ...key],
    queryFn: ({ pageParam }) => read(source.db!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.nextPageNo ?? undefined,
    enabled: !!source.db
  });
  return {
    rows: query.data?.pages.flatMap((page) => page.rows) ?? [],
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    loading: !source.error && query.isPending,
    loadingMore: query.isFetchingNextPage,
    error: source.error || query.error?.message || null,
    hasMore: query.hasNextPage,
    more: () => {
      if (query.hasNextPage && !query.isFetching && !query.isError) void query.fetchNextPage();
    },
    retry: () => (source.error ? source.retry() : void query.refetch())
  };
}
