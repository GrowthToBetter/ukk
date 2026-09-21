"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/profil", label: "Profil" },
  { href: "/admin/members", label: "Member" },
  { href: "/admin/spaces", label: "Space" },
  { href: "/admin/diskon", label: "Diskon" },
  { href: "/admin/reservasi", label: "Semua Reservasi" },
  { href: "/admin/reservasi/verifikasi", label: "Perlu Verifikasi" },
  { href: "/admin/reservasi/check-in", label: "Check-in" },
  { href: "/admin/laporan", label: "Laporan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, role, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (role === "member") { router.replace("/spaces"); }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading || !isAuthenticated || role !== "admin_space") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-100">
        <span className="font-mono text-ink-600">[ memuat… ]</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-ink-200 bg-paper-050">
        <div className="flex h-16 items-center px-6 border-b border-ink-200">
          <span className="font-display font-bold text-ink-950">ADMIN PANEL</span>
        </div>
        <nav className="flex flex-col p-4 gap-0">
          {ADMIN_NAV.map((link, i) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex items-center px-4 py-3 text-sm font-mono uppercase tracking-[0.1em] text-ink-600 transition-all hover:text-ink-950 hover:bg-ink-100"
              >
                {active && (
                    <motion.div 
                        layoutId="nav-active"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500"
                    />
                )}
                <span className="mr-3 text-ink-400">[{String(i + 1).padStart(2, '0')}]</span>
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="mt-8 px-4 py-3 text-left text-sm font-mono uppercase tracking-[0.1em] text-status-danger hover:bg-status-danger/10"
          >
            [ KELUAR ]
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12">{children}</main>
    </div>
  );
}
