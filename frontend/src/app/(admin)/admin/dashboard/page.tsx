"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/interactive/animated-number";
import { IndexBracket } from "@/components/IndexBracket";
import Link from "next/link";
import { type Reservasi } from "@/types/api";
import { StatusBadge } from "@/components/StatusBadge";

export default function DashboardPage() {
  const [stats, setStats] = useState({ total_members: 0, total_spaces: 0, total_diskon: 0, total_reservasi: 0, total_pendapatan: 0 });
  const [recentReservations, setRecentReservations] = useState<Reservasi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([
      apiClient.get<{ total_members: number; total_spaces: number; total_diskon: number; total_reservasi: number; total_pendapatan: number; }>("/maker/stats").then(res => setStats(res.data)),
      apiClient.get<{ data: Reservasi[] }>("/admin/reservasi").then(res => setRecentReservations(res.data.data.slice(0, 5)))
    ]).finally(() => setIsLoading(false));
  }, []);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
      <h1 className="font-display text-fs-h2 text-ink-950">Dashboard</h1>
      
      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-4 border-t border-ink-200">
        {[
            { label: "Member", val: stats.total_members },
            { label: "Space", val: stats.total_spaces },
            { label: "Diskon", val: stats.total_diskon },
            { label: "Reservasi", val: stats.total_reservasi },
        ].map((s, i) => (
            <div key={i} className="py-8 border-r border-ink-200 last:border-0">
                <span className="font-mono text-xs text-ink-600 block mb-2">{s.label}</span>
                <span className="text-3xl font-display text-ink-950"><AnimatedNumber value={s.val} /></span>
            </div>
        ))}
      </motion.div>
      <motion.div variants={item} className="p-8 border border-ink-200 bg-paper-050">
        <span className="font-mono text-xs text-ink-600 block mb-4">Total Pendapatan</span>
        <span className="text-4xl font-display text-accent-500"><AnimatedNumber value={stats.total_pendapatan} isCurrency /></span>
      </motion.div>

      {/* Recent Reservations */}
      <motion.div variants={item}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-mono text-sm uppercase tracking-widest text-ink-600">Reservasi Terbaru</h2>
            <Link href="/admin/reservasi" className="text-accent-500 hover:underline">[ Lihat semua → ]</Link>
        </div>
        <div className="border-t border-ink-200">
            {recentReservations.map((r, i) => (
                <motion.div variants={item} key={r.id} className="flex justify-between py-4 border-b border-ink-200">
                     <div className="flex items-center gap-4">
                        <IndexBracket n={i + 1} />
                        <span className="font-medium text-ink-950">{r.member.nama_member}</span>
                        <span className="text-ink-600">— {r.space.nama_space}</span>
                     </div>
                     <StatusBadge status={r.status} />
                </motion.div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}