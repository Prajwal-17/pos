import "../../global.css";

import { DatabaseBackup, RotateCcw } from "lucide-react-native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { migrateDatabase } from "@/lib/db/money-database";
import { DesktopDatabaseProvider } from "@/lib/db/desktop-database";

function RootNavigator() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F5F2" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="entry"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="channels"
          options={{ presentation: "modal", animation: "slide_from_right" }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [databaseKey, setDatabaseKey] = useState(0);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  return (
    <SafeAreaProvider>
      {databaseError ? (
        <SafeAreaView className="bg-canvas flex-1 items-center justify-center px-6">
          <View className="border-border bg-surface rounded-card w-full max-w-sm items-center border p-6">
            <View className="bg-accent-soft mb-4 h-12 w-12 items-center justify-center rounded-full">
              <DatabaseBackup color="#B6532B" size={24} strokeWidth={1.8} />
            </View>
            <Text className="text-ink text-2xl font-semibold">Ledger could not open</Text>
            <Text className="text-muted my-3 text-center text-sm leading-5">
              {databaseError.message || "The local database could not be prepared."}
            </Text>
            <AppButton
              className="w-full"
              icon={RotateCcw}
              onPress={() => {
                setDatabaseError(null);
                setDatabaseKey((value) => value + 1);
              }}
            >
              Try again
            </AppButton>
          </View>
        </SafeAreaView>
      ) : (
        <SQLiteProvider
          key={databaseKey}
          databaseName="quickcart-ledger.db"
          onInit={migrateDatabase}
          onError={setDatabaseError}
        >
          <DesktopDatabaseProvider>
            <RootNavigator />
          </DesktopDatabaseProvider>
        </SQLiteProvider>
      )}
    </SafeAreaProvider>
  );
}
