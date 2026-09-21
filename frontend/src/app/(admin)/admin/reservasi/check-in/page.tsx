"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { type Reservasi, type AdminReservasiListResponse } from "@/types/api";
import { IndexBracket } from "@/components/IndexBracket";

export default function CheckInReservasiPage() {
  const [reservasi, setReservasi] = useState<Reservasi[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckIn = () => {
    setLoading(true);
    apiClient.get<AdminReservasiListResponse>("/admin/reservasi?status=disetujui")
      .then(res => setReservasi(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCheckIn, []);

  const doCheckIn = async (id: number) => {
    try {
      await apiClient.post(`/admin/reservasi/${id}/check-in`);
      fetchCheckIn();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal check-in");
    }
  };

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <h1 className="font-display text-fs-h1 mb-12 text-ink-950">Siap Check-in</h1>
      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : reservasi.length === 0 ? (
        <p className="text-ink-600 font-body">Tidak ada reservasi yang siap di-check-in.</p>
      ) : (
        <div className="border-t border-ink-200">
            {reservasi.map((r, i) => (
                <div key={r.id} className="p-6 border-b border-ink-200 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <IndexBracket n={i + 1} />
                        <div>
                            <p className="font-display text-lg text-ink-950">{r.kode_booking} • {r.member.nama_member}</p>
                            <p className="font-body text-ink-600">{r.space.nama_space} | {r.tanggal_reservasi} • {r.jam_mulai}</p>
                        </div>
                    </div>
                    <button onClick={() => doCheckIn(r.id)} className="bg-ink-950 text-paper-100 px-6 py-3 font-mono text-xs">CHECK-IN</button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
