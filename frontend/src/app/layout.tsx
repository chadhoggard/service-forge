import type { Metadata } from "next";
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
        <div className="min-h-screen bg-gray-50">
          {/* Top Nav */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 bg-forge-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-forge-700 transition-colors">
                    <span className="text-white font-bold text-xs tracking-tight">
                      SF
                    </span>
                  </div>
                  <span className="text-base font-bold text-gray-900">
                    ServiceForge
                  </span>
                </a>

                {/* Nav links */}
                <nav className="flex items-center gap-1">
                  <a
                    href="/"
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/services/new"
                    className="ml-2 px-3 py-1.5 text-sm font-medium bg-forge-600 text-white rounded-lg hover:bg-forge-700 transition-colors"
                  >
                    + New Service
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
