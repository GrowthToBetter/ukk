"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { type Reservasi, type AdminReservasiListResponse, type StatusReservasi } from "@/types/api";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { IndexBracket } from "@/components/IndexBracket";
import { motion, AnimatePresence } from "motion/react";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

export default function ReservasiPage() {
  const [reservasi, setReservasi] = useState<Reservasi[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState<string>("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (dateStart) params.append("tanggal_awal", dateStart);
    if (dateEnd) params.append("tanggal_akhir", dateEnd);
    
    void apiClient.get<AdminReservasiListResponse>(`/admin/reservasi?${params.toString()}`).then(res => {
        setReservasi(res.data);
        setLoading(false);
    });
  }, [status, dateStart, dateEnd]);

  useEffect(fetchData, [fetchData]);

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <h1 className="font-display text-fs-h1 mb-12 text-ink-950">Semua Reservasi</h1>
      
      {/* Filters UI */}
      <div className="flex flex-wrap gap-4 mb-12 p-4 border border-ink-200">
        <input type="date" className="bg-transparent border-b outline-none" onChange={e => setDateStart(e.target.value)} value={dateStart} />
        <input type="date" className="bg-transparent border-b outline-none" onChange={e => setDateEnd(e.target.value)} value={dateEnd} />
        <select className="bg-transparent border-b outline-none" onChange={e => setStatus(e.target.value)} value={status}>
            <option value="">Semua Status</option>
            <option value="belum_dikonfirm">Belum Dikonfirmasi</option>
            <option value="disetujui">Disetujui</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
        </select>
        <button onClick={fetchData} className="bg-ink-950 text-paper-100 px-4 py-2 text-xs font-mono">FILTER</button>
      </div>

      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : reservasi.length === 0 ? (
        <p className="text-ink-600 font-body">Data reservasi tidak ditemukan.</p>
      ) : (
        <div className="border-t border-ink-200">
            {reservasi.map((r, i) => (
                <div key={r.id} className="flex justify-between items-center p-6 border-b border-ink-200 hover:bg-paper-050">
                    <div className="flex items-center gap-6">
                        <IndexBracket n={i + 1} />
                        <div>
                            <p className="font-display text-xl text-ink-950 mb-1">{r.kode_booking}</p>
                            <p className="font-body text-ink-600 tabular-nums">{r.member.nama_member} • {r.space.nama_space}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <StatusBadge status={r.status} />
                        <Link href={`/admin/reservasi/${r.id}`} className="text-fs-index font-bold text-accent-500 underline">DETAIL →</Link>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
