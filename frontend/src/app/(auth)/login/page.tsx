"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/types/api";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(role === "admin_space" ? "/admin/dashboard" : "/spaces");
    }
  }, [isLoading, isAuthenticated, role, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ username, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan tidak terduga. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-paper-100 font-mono text-fs-index">
        [ memproses… ]
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md p-8 border border-ink-600">
        <div className="mb-12">
          <h1 className="font-display text-4xl text-paper-100 mb-2">Masuk</h1>
          <p className="font-body text-ink-600">Selamat datang kembali</p>
        </div>

        {error && (
          <div className="mb-8 border border-status-danger p-4 text-sm text-status-danger font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <div>
            <label htmlFor="username" className="mb-2 block text-xs font-mono text-ink-200 uppercase tracking-widest">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              className="w-full bg-transparent border-b border-ink-600 py-3 text-paper-100 outline-none focus:border-accent-500 transition-colors font-body"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-mono text-ink-200 uppercase tracking-widest">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full bg-transparent border-b border-ink-600 py-3 text-paper-100 outline-none focus:border-accent-500 transition-colors font-body"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className="w-full bg-accent-500 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-accent-500/90 disabled:opacity-50"
          >
            {submitting ? "[ memproses… ]" : "MASUK"}
          </button>
        </form>

        <div className="mt-12 space-y-4 text-sm font-body">
          <p className="text-paper-100">
            Belum punya akun? {" "}
            <Link href="/register/member" className="text-accent-500 underline decoration-accent-500">Daftar Member</Link>
          </p>
          <p className="text-paper-100">
            Pengelola space? {" "}
            <Link href="/register/admin" className="text-accent-500 underline decoration-accent-500">Daftar Admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
