import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";
import { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";

import schema from "./desktop-schema.json";
import { DesktopSource } from "./desktop-source";

interface DesktopDatabaseState {
  db: SQLiteDatabase | null;
  error: string | null;
  retry: () => void;
}

const DesktopContext = createContext<DesktopDatabaseState | null>(null);

export async function validateDesktopDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA query_only = ON;");
  const check = await db.getFirstAsync<{ quick_check: string }>("PRAGMA quick_check");
  if (check?.quick_check !== "ok") throw new Error("Desktop data could not open.");
  for (const [table, columns] of Object.entries(schema)) {
    const actual = await db.getAllAsync<{ name: string }>(`PRAGMA table_info("${table}")`);
    if (columns.some((name) => !actual.some((column) => column.name === name))) {
      throw new Error("Desktop snapshot needs updating.");
    }
  }
}

export function DesktopDatabaseProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
            networkMode: "always",
            refetchOnWindowFocus: false
          }
        }
      })
  );
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const initialize = useCallback(async (database: SQLiteDatabase) => {
    await validateDesktopDatabase(database);
    setDb(database);
  }, []);
  const failed = useCallback(
    (failure: Error) => setError(failure.message || "Desktop data could not open."),
    []
  );

  return (
    <QueryClientProvider client={client}>
      <DesktopContext.Provider
        value={{
          db,
          error,
          retry: () => {
            client.clear();
            setDb(null);
            setError(null);
            setAttempt((value) => value + 1);
          }
        }}
      >
        <DesktopSource key={attempt} onInit={initialize} onError={failed} />
        {/* Siblings retain the money DB context, even if snapshot loading fails. */}
        {children}
      </DesktopContext.Provider>
    </QueryClientProvider>
  );
}

export function useDesktopDatabase(): DesktopDatabaseState {
  const value = useContext(DesktopContext);
  if (!value) throw new Error("DesktopDatabaseProvider is missing.");
  return value;
}
