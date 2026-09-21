"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MemberShell } from "@/components/MemberShell";
import { StatusBadge } from "@/components/StatusBadge";
import { apiClient } from "@/lib/api-client";
import { type Reservasi } from "@/types/api";
import Link from "next/link";
import { BuktiBayarPreview } from "@/components/interactive/BuktiBayarPreview";

export default function ReservasiDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [res, setRes] = useState<Reservasi | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const fetchData = () => {
    if (id) apiClient.get<Reservasi>(`/reservasi/${id}`).then(r => setRes(r.data));
  };

  useEffect(fetchData, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.post(`/reservasi/${id}/bukti-bayar`, formData);
      setSuccess("Bukti pembayaran berhasil diunggah");
      
      setTimeout(() => {
        router.push('/reservasi');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal upload bukti bayar");
      setUploading(false);
    }
  };

  if (!res) return <MemberShell><div className="p-12 text-ink-600 font-mono">[ memuat… ]</div></MemberShell>;

  const showQr = ['disetujui', 'aktif', 'selesai'].includes(res.status);

  return (
    <MemberShell>
      <div className="p-4 md:p-12 bg-paper-100 min-h-screen max-w-2xl mx-auto">
        <h1 className="font-display text-fs-h2 mb-8 text-ink-950">Detail Reservasi</h1>
        
        <div className="bg-paper-050 p-8 border border-ink-200 space-y-6">
            <div className="flex justify-between items-start">
                <p className="font-display text-2xl text-ink-950">{res.kode_booking}</p>
                <StatusBadge status={res.status} />
            </div>

            <div className="space-y-2 font-body text-ink-600 border-t border-ink-200 pt-6">
              <p>Space: <span className="text-ink-950 font-bold">{res.space.nama_space}</span></p>
              <p>Jadwal: <span className="text-ink-950 font-bold">{res.tanggal_reservasi} • {res.jam_mulai} - {res.jam_selesai}</span></p>
              <p>Total: <span className="text-ink-950 font-bold">Rp{res.total_bayar.toLocaleString()}</span></p>
            </div>

            {/* Bukti Bayar Section */}
            <div className="pt-6 border-t border-ink-200">
                <h3 className="text-fs-index font-mono uppercase mb-4 text-ink-950">Bukti Pembayaran</h3>
                {success && <p className="text-accent-500 font-mono text-fs-index mb-4">{success}</p>}
                
                {res.status === 'dibatalkan' ? (
                  <p className="text-status-danger font-mono text-xs">[ Reservasi dibatalkan ]</p>
                ) : res.bukti_bayar_url && !isReplacing ? (
                    <BuktiBayarPreview 
                        url={res.bukti_bayar_url} 
                        status={res.status} 
                        canReplace={res.status === 'belum_dikonfirm'}
                        onReplace={() => setIsReplacing(true)}
                    />
                ) : res.status === 'belum_dikonfirm' ? (
                    <div className="space-y-4">
                        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="block w-full text-ink-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ink-950 file:text-paper-100 disabled:opacity-50" />
                        {uploading && <p className="text-ink-600 font-mono">[ mengunggah… ]</p>}
                        {error && <p className="text-status-danger font-mono text-fs-index">{error}</p>}
                        {isReplacing && <button onClick={() => setIsReplacing(false)} className="text-ink-600 font-mono text-xs underline hover:text-ink-950">[ Batal ]</button>}
                    </div>
                ) : (
                    <p className="text-ink-600 font-mono">[ belum diupload ]</p>
                )}
            </div>

            {/* QR Section */}
            {showQr && (
                <div className="pt-6 border-t border-ink-200 flex flex-col items-center">
                    <h3 className="text-fs-index font-mono uppercase mb-4 text-ink-950">E-Ticket QR</h3>
                    <Link href={`/reservasi/${id}/e-ticket`} className="font-bold text-accent-500 underline">Lihat Full E-Ticket →</Link>
                </div>
            )}
        </div>
      </div>
    </MemberShell>
  );
}
