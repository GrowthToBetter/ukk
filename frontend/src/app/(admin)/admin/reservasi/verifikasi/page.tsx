"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { type Reservasi, type AdminReservasiListResponse } from "@/types/api";
import { StatusBadge } from "@/components/StatusBadge";
import { IndexBracket } from "@/components/IndexBracket";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

export default function VerifikasiReservasiPage() {
  const [reservasi, setReservasi] = useState<Reservasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchVerifikasi = () => {
    setLoading(true);
    apiClient.get<AdminReservasiListResponse>("/admin/reservasi?status=belum_dikonfirm")
      .then(res => {
        // Filter di klien
        setReservasi(res.data.filter(r => r.bukti_bayar !== null));
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchVerifikasi, []);

  const updateStatus = async (id: number, status: "disetujui" | "dibatalkan") => {
    try {
      await apiClient.patch(`/admin/reservasi/${id}/status`, { status });
      fetchVerifikasi(); // Refresh
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memproses reservasi");
    }
  };

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <h1 className="font-display text-fs-h1 mb-12 text-ink-950">Perlu Verifikasi</h1>
      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : reservasi.length === 0 ? (
        <p className="text-ink-600 font-body">Tidak ada reservasi yang menunggu verifikasi.</p>
      ) : (
        <div className="border-t border-ink-200">
            {reservasi.map((r, i) => (
                <div key={r.id} className="p-6 border-b border-ink-200 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <IndexBracket n={i + 1} />
                        <div>
                            <p className="font-display text-lg text-ink-950">{r.kode_booking} • {r.member.nama_member}</p>
                            <p className="font-body text-ink-600">{r.space.nama_space} | Rp{r.total_bayar.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {r.bukti_bayar && (
                        <button onClick={() => setPreviewImage(`https://res.cloudinary.com/da42gwvhf/image/upload/${r.bukti_bayar}`)}>
                           <img src={`https://res.cloudinary.com/da42gwvhf/image/upload/${r.bukti_bayar}`} className="w-16 h-16 object-cover border border-ink-200" alt="bukti" />
                        </button>
                      )}
                      <button onClick={() => updateStatus(r.id, 'disetujui')} className="bg-accent-500 text-paper-100 px-4 py-2 font-mono text-xs">APPROVE</button>
                      <button onClick={() => updateStatus(r.id, 'dibatalkan')} className="bg-status-danger text-paper-100 px-4 py-2 font-mono text-xs">REJECT</button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-ink-950/80 flex items-center justify-center p-8 z-50" onClick={() => setPreviewImage(null)}>
           <img src={previewImage} className="max-w-full max-h-full object-contain" alt="Bukti" />
        </div>
      )}
    </div>
  );
}
