import type { SQLiteDatabase, SQLiteBindValue } from "expo-sqlite";

export type ReadDatabase = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync">;
export interface Page<T> {
  rows: T[];
  totalCount: number;
  nextPageNo: number | null;
}

export async function readPage<T>(
  db: ReadDatabase,
  sql: string,
  params: SQLiteBindValue[],
  order: string,
  page = 1
): Promise<Page<T>> {
  const size = 50;
  const [rows, count] = await Promise.all([
    db.getAllAsync<T>(
      `${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      ...params,
      size,
      (page - 1) * size
    ),
    db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM (${sql})`, ...params)
  ]);
  const totalCount = count?.count ?? 0;
  return { rows, totalCount, nextPageNo: page * size < totalCount ? page + 1 : null };
}

export function searchPattern(value: string): string {
  return `%${value
    .trim()
    .toLowerCase()
    .replace(/[\\%_]/g, "\\$&")}%`;
}
