"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/spaces", label: "Cari Space", index: "01" },
  { href: "/reservasi", label: "Reservasi Saya", index: "02" },
  { href: "/histori", label: "Histori", index: "03" },
];

export function MemberShell({ children }: { children: React.ReactNode }) {
  const { logout, member, user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper-100">
      <header className="sticky top-0 z-50 border-b border-ink-200 bg-paper-100/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-display text-xl font-bold text-ink-950">
            [SpaceBooking]
          </Link>
          
          <div className="flex items-center gap-8">
              <nav className="hidden items-center gap-8 text-fs-index font-mono sm:flex">
                {NAV_LINKS.map(({ href, label, index }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={active ? "text-accent-500 font-bold" : "text-ink-600 hover:text-ink-950"}
                    >
                      [{index}] {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-4 border-l border-ink-200 pl-8">
                <span className="text-fs-index text-ink-600">
                  {member?.nama_member ?? user?.username}
                </span>
                <button
                  onClick={logout}
                  className="border border-ink-200 px-4 py-2 text-xs font-bold text-ink-950 transition hover:bg-ink-950 hover:text-paper-100"
                >
                  [ KELUAR ]
                </button>
              </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}

