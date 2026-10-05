import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <MobileNav />

          <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-10">
            <div className="mx-auto w-full max-w-5xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}