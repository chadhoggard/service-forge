"use client";

import Image from "next/image";
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
    <div className="flex items-center justify-between py-4">
      <Link href="/" className="flex items-center gap-2 group">
        <Image src="/logo.png" alt="ServiceForge" width={32} height={32} className="rounded-lg" />
        <span className="text-xl font-bold text-gray-900">ServiceForge</span>
      </Link>

      {user ? (
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/services/new"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            + New Service
          </Link>
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </nav>
      ) : null}
    </div>
  );
}
