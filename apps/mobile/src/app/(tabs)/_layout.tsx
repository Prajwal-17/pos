import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { House, FileText, Package, Receipt, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync().catch(() => {});
        }
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B6532B",
        tabBarInactiveTintColor: "#4D544C",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D8D5CC",
          elevation: 0,
          height: 60 + insets.bottom,
          paddingTop: 4,
          paddingBottom: 4 + insets.bottom
        },
        tabBarIconStyle: { width: 24, height: 24 },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: "600", flexShrink: 0 },
        tabBarLabelPosition: "below-icon",
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={1.8} />
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color }) => <Receipt size={22} color={color} strokeWidth={1.8} />
        }}
      />
      <Tabs.Screen
        name="estimates"
        options={{
          title: "Estimates",
          tabBarIcon: ({ color }) => <FileText size={22} color={color} strokeWidth={1.8} />
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={1.8} />
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => <Package size={22} color={color} strokeWidth={1.8} />
        }}
      />
    </Tabs>
  );
}
