"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomTabBar } from "./bottom-tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
