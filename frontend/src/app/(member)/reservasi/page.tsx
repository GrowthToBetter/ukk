"use client";

import { useEffect, useState, useCallback } from "react";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { type MyReservasiResponse, type ReservasiListItem } from "@/types/api";
import Link from "next/link";
import { EvidenceCard } from "@/components/interactive/evidence-card";

export default function MyReservasiPage() {
  const [data, setData] = useState<ReservasiListItem[]>([]);
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
    
    apiClient.get<MyReservasiResponse>(`/reservasi/my?${params.toString()}`)
      .then(res => setData(res.data.reservasi))
      .finally(() => setLoading(false));
  }, [status, dateStart, dateEnd]);

  useEffect(fetchData, [fetchData]);

  const renderAction = (r: ReservasiListItem) => {
     if (['disetujui', 'aktif', 'selesai'].includes(r.status)) {
        return <Link href={`/reservasi/${r.id}/e-ticket`} className="text-accent-500 font-bold underline">Lihat E-Ticket →</Link>;
     }
     
     if (r.status === 'dibatalkan') {
         return <span className="text-status-danger font-mono text-xs">[ Reservasi dibatalkan ]</span>;
     }

     return <span className="text-ink-600 font-mono text-xs">[ Menunggu verifikasi admin ]</span>;
  };

  return (
    <MemberShell>
      <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
        <h1 className="font-display text-fs-h2 mb-12 text-ink-950">Reservasi Saya</h1>
        
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
        ) : data.length === 0 ? (
            <p className="text-ink-600 font-body">Belum ada reservasi. <Link href="/spaces" className="text-accent-500 underline font-bold transition hover:text-accent-500/80">[ Cari space → ]</Link></p>
        ) : (
            <div className="grid md:grid-cols-2 gap-8">
                {data.map((r, i) => (
                    <EvidenceCard
                        key={r.id}
                        index={i + 1}
                        title={r.kode_booking}
                        meta={`${r.space.nama_space} | ${r.tanggal_reservasi} | ${r.status}`}
                        image={r.space.foto_url || undefined}
                        action={{ label: "Detail", href: `/reservasi/${r.id}` }}
                        variant={i % 2 === 0 ? "light" : "dark"}
                    >
                        <div className="flex justify-between items-center mt-4">
                           <p>Total: Rp{r.total_bayar.toLocaleString()}</p>
                           {renderAction(r)}
                        </div>
                    </EvidenceCard>
                ))}
            </div>
        )}
      </div>
    </MemberShell>
  );
}
