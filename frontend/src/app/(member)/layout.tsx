"use client";

/**
 * Layout guard untuk semua halaman di group (member).
 * - isLoading → spinner (jangan redirect dulu, hindari flash)
 * - !isAuthenticated → redirect /login
 * - role === 'admin_space' → redirect /admin/dashboard (rol salah)
 * - role === 'member' → render children
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (role === "admin_space") {
      router.replace("/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, role, router]);

  // Spinner saat hydrating atau saat akan redirect
  if (isLoading || !isAuthenticated || role !== "member") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
