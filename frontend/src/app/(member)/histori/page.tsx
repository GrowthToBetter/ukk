"use client";

import { useEffect, useState, useCallback } from "react";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { type ReservasiHistoryResponse, type ReservasiHistoryItem } from "@/types/api";
import { IndexBracket } from "@/components/IndexBracket";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedPrice } from "@/components/interactive/animated-price";
import { motion, AnimatePresence } from "motion/react";

export default function HistoriPage() {
  const [data, setData] = useState<ReservasiHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get<ReservasiHistoryResponse>("/reservasi/my/history", {
        month: filter.month.toString(),
        year: filter.year.toString()
    });
    setData(res.data.items);
    setTotal(res.data.total_pengeluaran);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void fetchData() }, [fetchData]);

  return (
    <MemberShell>
      <div className="p-4 md:p-12 min-h-screen">
        <h1 className="font-display text-fs-h1 mb-12 text-ink-950">Histori Reservasi</h1>
        
        <div className="flex gap-4 mb-12">
            <select value={filter.month} onChange={e => setFilter({...filter, month: Number(e.target.value)})} className="bg-transparent border-b border-ink-200 py-2 outline-none focus:border-accent-500 font-mono text-fs-index">
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
            </select>
            <input type="number" value={filter.year} onChange={e => setFilter({...filter, year: Number(e.target.value)})} className="bg-transparent border-b border-ink-200 py-2 outline-none focus:border-accent-500 w-20 font-mono text-fs-index"/>
        </div>

        <div className="mb-12 border border-ink-200 p-8 bg-paper-050 relative">
            <span className="font-mono text-fs-index text-ink-600">Total Pengeluaran</span>
            <div className="text-4xl font-display text-ink-950 mt-2">
                <AnimatedPrice value={total} />
            </div>
            {/* Crop-marks */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos) => (
                <span
                key={pos}
                aria-hidden
                className={`absolute ${pos} z-10 h-3 w-3 border-accent-500`}
                style={{ 
                    borderTop: pos.includes('top') ? '1px solid currentColor' : 'none',
                    borderBottom: pos.includes('bottom') ? '1px solid currentColor' : 'none',
                    borderLeft: pos.includes('left') ? '1px solid currentColor' : 'none',
                    borderRight: pos.includes('right') ? '1px solid currentColor' : 'none',
                }}
                />
            ))}
        </div>
        
        {loading ? (
             <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
        ) : data.length === 0 ? (
            <p className="text-ink-600 font-body">Belum ada histori di bulan ini.</p>
        ) : (
            <div className="border-t border-ink-200">
                <AnimatePresence>
                {data.map((r, i) => (
                    <motion.div 
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-8 border-b border-ink-200 flex justify-between items-center group hover:bg-paper-050"
                    >
                        <div className="flex items-center gap-6">
                            <IndexBracket n={i + 1} />
                            <div>
                                <p className="font-display text-xl text-ink-950 mb-1">{r.kode_booking}</p>
                                <p className="font-body text-ink-600 tabular-nums">{r.space.nama_space} • {r.tanggal_reservasi}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <span className="font-bold font-display text-ink-950 tabular-nums text-lg"><AnimatedPrice value={r.total_bayar} /></span>
                            <StatusBadge status={r.status} />
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        )}
      </div>
    </MemberShell>
  );
}
