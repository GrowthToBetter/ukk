"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";

import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  type LoginMemberResponse,
  type RegisterMemberDto,
} from "@/types/api";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } } as const;
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

export default function RegisterMemberPage() {
  const { loginFromResponse } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Record<string, string>>({
    username: "",
    password: "",
    nama_member: "",
    instansi: "",
    alamat: "",
    telp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFoto] = useState(false); // Simplified

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "", general: "" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const payload: RegisterMemberDto = {
        username: form.username || "",
        password: form.password || "",
        nama_member: form.nama_member || "",
        instansi: form.instansi || "",
        alamat: form.alamat || "",
        telp: form.telp || "",
      };

      const res = await apiClient.post<LoginMemberResponse>("/auth/register/member", payload);
      loginFromResponse(res.data);
      router.replace("/spaces");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(err.errors)) {
            fieldErrors[field] = messages[0] || "";
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: "Terjadi kesalahan tidak terduga." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 text-paper-100 p-4 md:p-12 flex items-center justify-center">
      <div className="w-full max-w-lg border border-ink-600 p-8">
        <div className="mb-12">
          <h1 className="font-display text-4xl text-paper-100 mb-2">Daftar Member</h1>
          <p className="font-body text-ink-600">Buat akun untuk mulai memesan</p>
        </div>

        {errors.general && (
          <div className="mb-8 border border-status-danger p-4 text-sm text-status-danger font-mono">
            {errors.general}
          </div>
        )}

        <motion.form variants={container} initial="hidden" animate="show" onSubmit={handleSubmit} noValidate className="space-y-8">
          {[
            { id: "username", label: "Username" },
            { id: "password", label: "Password", type: "password" },
            { id: "nama_member", label: "Nama Lengkap" },
            { id: "instansi", label: "Instansi" },
            { id: "alamat", label: "Alamat" },
            { id: "telp", label: "Nomor Telepon", type: "tel" },
          ].map((field) => (
            <motion.div key={field.id} variants={item}>
              <label htmlFor={field.id} className="mb-2 block text-xs font-mono text-ink-200 uppercase tracking-widest">{field.label}</label>
              <input
                id={field.id}
                type={field.type || "text"}
                required
                value={form[field.id] || ""}
                onChange={(e) => setField(field.id, e.target.value)}
                disabled={submitting}
                className="w-full bg-transparent border-b border-ink-600 py-3 text-paper-100 outline-none focus:border-accent-500 transition-colors font-body"
              />
              {errors[field.id] && <p className="mt-1 text-xs text-status-danger font-mono">{errors[field.id]}</p>}
            </motion.div>
          ))}

            <motion.button
            variants={item}
            type="submit"
            disabled={submitting || uploadingFoto}
            className="w-full bg-accent-500 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-accent-500/90 disabled:opacity-50"
          >
            {submitting ? "[ memproses… ]" : "DAFTAR SEKARANG"}
          </motion.button>
        </motion.form>

        <p className="mt-12 text-sm font-body text-paper-100">
          Sudah punya akun? <Link href="/login" className="text-accent-500 underline decoration-accent-500">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
