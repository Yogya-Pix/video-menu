"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/orders", label: "Orders" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.push("/login");
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (!session) {
    return null; // SessionProvider is already redirecting to /login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{session.restaurant.name}</p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-4 px-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-1 py-2.5 text-sm font-medium ${
                  active ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
