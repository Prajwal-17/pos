import { Sidebar } from "./Sidebar";

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto flex h-screen min-h-screen w-full">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}
