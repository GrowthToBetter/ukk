"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { type Reservasi } from "@/types/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedPrice } from "@/components/interactive/animated-price";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

export default function ReservasiDetailPage() {
  const { id } = useParams();
  const [r, setR] = useState<Reservasi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (id) {
        const tid = Array.isArray(id) ? id[0] : id;
        const res = await apiClient.get<Reservasi>(`/reservasi/${tid}`);
        setR(res.data);
        setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchData() }, [fetchData]);

  const updateStatus = async (status: string) => {
    const res = await apiClient.patch<{data: Reservasi}>(`/admin/reservasi/${id}/status`, { status });
    setR(res.data.data);
  };

  const action = async (url: string) => {
    const res = await apiClient.post<{data: Reservasi}>(url);
    setR(res.data.data);
  };

  if (loading) return <div className="p-12 text-ink-600 font-mono">[ memuat… ]</div>;
  if (!r) return <div className="p-12 text-ink-600">Reservasi tidak ditemukan.</div>;

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-paper-050 border border-ink-200">
        <div className="p-8 border-b border-ink-200 flex justify-between items-start">
           <div>
              <span className="font-mono text-fs-index text-ink-600 block mb-2">[01] Detail Reservasi</span>
              <h1 className="text-fs-h2 font-display text-ink-950">{r.kode_booking}</h1>
           </div>
           <StatusBadge status={r.status} />
        </div>
        
        <div className="p-8 space-y-6 text-ink-950 font-body">
            <div className="flex justify-between border-b border-ink-200 py-2">
                <span className="text-ink-600">Member</span>
                <span className="font-bold">{r.member.nama_member}</span>
            </div>
            <div className="flex justify-between border-b border-ink-200 py-2">
                <span className="text-ink-600">Space</span>
                <span className="font-bold">{r.space.nama_space}</span>
            </div>
            <div className="flex justify-between border-b border-ink-200 py-2">
                <span className="text-ink-600">Tanggal</span>
                <span className="font-bold">{r.tanggal_reservasi}</span>
            </div>
            <div className="flex justify-between border-b border-ink-200 py-2">
                <span className="text-ink-600">Waktu</span>
                <span className="font-bold tabular-nums">{r.jam_mulai} - {r.jam_selesai}</span>
            </div>
            <div className="flex justify-between border-b border-ink-200 py-2">
                <span className="text-ink-600">Total Pembayaran</span>
                <span className="font-bold"><AnimatedPrice value={r.total_bayar} /></span>
            </div>
        </div>

        <div className="p-8 flex flex-wrap gap-4 border-t border-ink-200">
            {r.status === 'belum_dikonfirm' && (
            <>
                <MagneticHover>
                    <button onClick={() => updateStatus('disetujui')} className="bg-ink-950 text-paper-100 px-8 py-3 text-fs-index uppercase tracking-widest hover:bg-ink-800 transition-colors">Setujui</button>
                </MagneticHover>
                <MagneticHover>
                    <button onClick={() => updateStatus('dibatalkan')} className="border border-status-danger text-status-danger px-8 py-3 text-fs-index uppercase tracking-widest hover:bg-status-danger hover:text-white transition-colors">Tolak</button>
                </MagneticHover>
            </>
            )}
            {r.status === 'disetujui' && (
                <MagneticHover>
                    <button onClick={() => action(`/admin/reservasi/${id}/check-in`)} className="bg-accent-500 text-paper-100 px-8 py-3 text-fs-index uppercase tracking-widest hover:bg-accent-500/90 transition-colors">Check-in</button>
                </MagneticHover>
            )}
            {r.status === 'aktif' && (
                <MagneticHover>
                    <button onClick={() => action(`/admin/reservasi/${id}/check-out`)} className="bg-accent-500 text-paper-100 px-8 py-3 text-fs-index uppercase tracking-widest hover:bg-accent-500/90 transition-colors">Check-out</button>
                </MagneticHover>
            )}
        </div>
      </div>
    </div>
  );
}
