import type { Metadata } from "next";

import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ServiceForge",
    template: "%s · ServiceForge",
  },
  description:
    "Self-service deployment platform for containerized applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
