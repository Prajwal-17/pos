import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar";

export default function SidebarLayout() {
  return (
    <>
      <div className="mx-auto flex h-screen min-h-screen w-full bg-red-500">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
}
