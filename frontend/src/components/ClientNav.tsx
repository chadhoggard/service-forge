"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function ClientNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex items-center justify-between h-14">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-7 h-7 bg-forge-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-forge-700 transition-colors">
          <span className="text-white font-bold text-xs tracking-tight">SF</span>
        </div>
        <span className="text-base font-bold text-gray-900">ServiceForge</span>
      </Link>

      {user ? (
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/services/new"
            className="ml-2 px-3 py-1.5 text-sm font-medium bg-forge-600 text-white rounded-lg hover:bg-forge-700 transition-colors"
          >
            + New Service
          </Link>
          <span className="ml-3 text-xs text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="ml-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </nav>
      ) : null}
    </div>
  );
}
