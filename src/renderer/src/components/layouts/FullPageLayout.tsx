import { Outlet } from "react-router-dom";

export default function FullPageLayout() {
  return (
    <>
      <div className="mx-auto flex h-screen min-h-screen w-full">
        <Outlet />
      </div>
    </>
  );
}
