import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="min-h-full p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
