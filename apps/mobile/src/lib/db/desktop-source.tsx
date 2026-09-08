import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { useCallback } from "react";

export interface DesktopSourceProps {
  onInit: (db: SQLiteDatabase) => Promise<void>;
  onError: (error: Error) => void;
}

export function DesktopSource({ onInit, onError }: DesktopSourceProps) {
  const initialize = useCallback(
    async (database: SQLiteDatabase) => {
      try {
        await onInit(database);
      } catch (error) {
        await database.closeAsync();
        throw error;
      }
    },
    [onInit]
  );
  return (
    <SQLiteProvider
      databaseName="relay-desktop.db"
      assetSource={{ assetId: require("../../../assets/data/desktop.db"), forceOverwrite: true }}
      onInit={initialize}
      onError={onError}
    >
      {null}
    </SQLiteProvider>
  );
}
