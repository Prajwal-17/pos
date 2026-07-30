import Customers from "@/pages/customers/CustomersPage";
import Dashboard from "@/pages/dashboard/DashboardPage";
import Home from "@/pages/home/HomePage";
import PrinterTestPage from "@/pages/printer/PrinterTestPage";
import ProductsPage from "@/pages/products/ProductsPage";
import Reports from "@/pages/reports/ReportsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import {
  ChartColumn,
  House,
  Package,
  Printer,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";

type NavlinkType = {
  href: string;
  title: string;
  element: React.ReactNode;
  icon?: React.ReactNode;
};
export const navLinks: NavlinkType[] = [
  {
    href: "/",
    title: "Home",
    element: <Home />,
    icon: <House size={24} />
  },
  {
    href: "/products",
    title: "Products",
    element: <ProductsPage />,
    icon: <Package size={24} />
  },
  {
    href: "/customers",
    title: "Customers",
    element: <Customers />,
    icon: <Users size={24} />
  },
  {
    href: "/dashboard/sales",
    title: "Sales",
    element: <Dashboard />,
    icon: <ShoppingCart size={24} />
  },
  {
    href: "/dashboard/estimates",
    title: "Estimates",
    element: <Dashboard />,
    icon: <ReceiptText size={24} />
  },
  {
    href: "/reports",
    title: "Reports",
    element: <Reports />,
    icon: <ChartColumn size={24} />
  },
  {
    href: "/printer-test",
    title: "Print playground",
    element: <PrinterTestPage />,
    icon: <Printer size={24} />
  },
  {
    href: "/settings",
    title: "Settings",
    element: <SettingsPage />,
    icon: <Settings size={24} />
  }
];
