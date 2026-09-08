import { Asset } from "expo-asset";
import { deserializeDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { useEffect } from "react";
import type { DesktopSourceProps } from "./desktop-source";

export function DesktopSource({ onInit, onError }: DesktopSourceProps) {
  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    let database: SQLiteDatabase | null = null;
    async function open() {
      try {
        const asset = Asset.fromModule(require("../../../assets/data/desktop.db"));
        const response = await fetch(asset.uri, { signal: abort.signal });
        if (!response.ok) throw new Error("Desktop snapshot could not load.");
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (disposed) return;
        // A read-only snapshot needs no OPFS rewrite on every browser reload.
        database = await deserializeDatabaseAsync(bytes);
        if (disposed) {
          await database.closeAsync();
          database = null;
          return;
        }
        await onInit(database);
      } catch (error) {
        await database?.closeAsync().catch(() => {});
        database = null;
        if (!disposed) onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
    void open();
    return () => {
      disposed = true;
      abort.abort();
      void database?.closeAsync().catch(() => {});
    };
  }, [onInit, onError]);
  return null;
}
