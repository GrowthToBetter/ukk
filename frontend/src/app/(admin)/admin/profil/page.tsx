"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { type UpdateProfileDto } from "@/types/api";
import { motion, AnimatePresence } from "motion/react";

export default function ProfilPage() {
  const [form, setForm] = useState<UpdateProfileDto>({ nama_coworking: "", nama_pemilik: "", telp: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    void apiClient.get<{nama_coworking: string, nama_pemilik: string, telp: string}>("/admin/profile").then(res => setForm(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    await apiClient.put("/admin/profile", form);
    
    setStatus("success");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="max-w-xl mx-auto p-12 bg-paper-100 border border-ink-200 rounded-none shadow-none">
        <h1 className="text-fs-h2 font-display mb-12 text-ink-950">Edit Profil</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
                <input className="w-full border border-ink-200 p-4 text-fs-body text-ink-950 focus:border-ink-950 outline-none rounded-none" value={form.nama_coworking} onChange={e => setForm({...form, nama_coworking: e.target.value})} placeholder="Nama Coworking" />
                <input className="w-full border border-ink-200 p-4 text-fs-body text-ink-950 focus:border-ink-950 outline-none rounded-none" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} placeholder="Nama Pemilik" />
                <input className="w-full border border-ink-200 p-4 text-fs-body text-ink-950 focus:border-ink-950 outline-none rounded-none" value={form.telp} onChange={e => setForm({...form, telp: e.target.value})} placeholder="Telepon" />
            </div>
            
            <button 
                type="submit" 
                disabled={status !== "idle"}
                className="bg-ink-950 text-paper-100 px-8 py-4 font-bold text-fs-body hover:bg-ink-800 transition-colors w-full flex items-center justify-center gap-2 rounded-none"
            >
                <AnimatePresence mode="wait">
                    {status === "success" ? (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>✓ Tersimpan</motion.span>
                    ) : (
                        <span>{status === "submitting" ? "Menyimpan..." : "Simpan Perubahan"}</span>
                    )}
                </AnimatePresence>
            </button>
        </form>
    </div>
  );
}
