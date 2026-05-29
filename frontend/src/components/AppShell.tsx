"use client";

import { usePathname } from "next/navigation";

import ClientNav from "@/components/ClientNav";

const AUTH_PAGES = new Set(["/login", "/register"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname ? AUTH_PAGES.has(pathname) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <ClientNav />
        </div>
      </header>

      <main className={isAuthPage ? "" : "max-w-7xl mx-auto px-6 py-8"}>
        {children}
      </main>
    </div>
  );
}
