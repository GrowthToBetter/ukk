"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { 
  type AvailabilityResult, 
  type DiskonCheckResult, 
  ApiError,
  type Space
} from "@/types/api";
import { BookingStepper } from "@/components/interactive/booking-stepper";

export default function ReservasiBaruPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id_space = Number(searchParams.get("id_space"));

  const [form, setForm] = useState({
    tanggal_reservasi: new Date().toISOString().split("T")[0],
    jam_mulai: "09:00",
    durasi_jam: 1,
    kode_promo: "",
  });

  const [avail, setAvail] = useState<AvailabilityResult | null>(null);
  const [promo, setPromo] = useState<DiskonCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);

  useEffect(() => {
    apiClient.get<Space>(`/spaces/${id_space}`).then(res => setSpace(res.data));
  }, [id_space]);

  const checkAvailability = useCallback(async () => {
    try {
      const res = await apiClient.get<AvailabilityResult>("/spaces/availability", {
        id_space: id_space.toString(),
        tanggal: form.tanggal_reservasi,
        jam_mulai: form.jam_mulai,
        durasi_jam: form.durasi_jam.toString(),
      });
      setAvail(res.data);
      setError(null);
    } catch (err: unknown) {
      setAvail(null);
      setError(err instanceof ApiError ? err.message : "Gagal cek ketersediaan");
    }
  }, [id_space, form.tanggal_reservasi, form.jam_mulai, form.durasi_jam]);

  // Auto-check availability when form changes (Debounced ideally, but simple for now)
  useEffect(() => {
    checkAvailability();
  }, [form.tanggal_reservasi, form.jam_mulai, form.durasi_jam, checkAvailability]);

  const checkPromo = async () => {
    if (!form.kode_promo) {
      setPromo(null);
      return;
    }
    try {
      const res = await apiClient.post<DiskonCheckResult>("/diskon/check", {
        nama_diskon: form.kode_promo,
      });
      setPromo(res.data);
      setError(null);
    } catch (err: unknown) {
      setPromo(null);
      setError(err instanceof ApiError ? err.message : "Promo tidak valid");
    }
  };

  async function submitReservasi() {
    setSubmitting(true);
    try {
      // Pisahkan kode_promo dari payload — backend /reservasi tidak menerima field ini,
      // hanya menerima id_diskon (sudah di-resolve saat checkPromo).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { kode_promo: _kp, ...formPayload } = form;

      const res = await apiClient.post<{ id: number }>("/reservasi", {
        id_space,
        ...formPayload,
        ...(promo?.id ? { id_diskon: promo.id } : {}),
      });
      // Redirect ke detail reservasi untuk upload bukti bayar
      router.push(`/reservasi/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Gagal Reservasi");
      setSubmitting(false); // Enable button again if error
    }
  }

  return (
    <MemberShell>
      <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
        <h1 className="font-display text-fs-h2 mb-12 text-ink-950">Pesan Space</h1>
        
        <BookingStepper render={(step) => (
            <div className="space-y-8 bg-paper-050 p-8 border border-ink-200">
                {step === 'tanggal-jam' && (
                    <div className="space-y-6">
                        <label className="block text-fs-index font-mono text-ink-600 uppercase tracking-widest">[01] Atur Jadwal</label>
                        <input type="date" className="w-full bg-transparent border-b border-ink-200 py-3 text-ink-950 outline-none focus:border-accent-500" 
                            value={form.tanggal_reservasi} onChange={e => setForm({...form, tanggal_reservasi: e.target.value})} />
                        <input type="time" className="w-full bg-transparent border-b border-ink-200 py-3 text-ink-950 outline-none focus:border-accent-500" 
                            value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} />
                        <input type="number" min="1" className="w-full bg-transparent border-b border-ink-200 py-3 text-ink-950 outline-none focus:border-accent-500" 
                            value={form.durasi_jam} onChange={e => setForm({...form, durasi_jam: Number(e.target.value)})} placeholder="Durasi (jam)" />
                        
                        {avail && (
                           <div className={`text-fs-index p-4 border ${avail.available ? 'border-accent-500 text-accent-500' : 'border-status-danger text-status-danger'}`}>
                             {avail.message}
                           </div>
                        )}
                        {avail?.available && (
                            <button onClick={() => {
                                const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-nav-btn');
                                stepperButtons[1]?.click();
                            }} className="w-full bg-ink-950 text-paper-100 py-3 font-bold hover:bg-ink-800">Lanjut</button>
                        )}
                    </div>
                )}
                {step === 'ringkasan-promo' && (
                    <div className="space-y-6">
                        <label className="block text-fs-index font-mono text-ink-600 uppercase tracking-widest">[02] Ringkasan & Promo</label>
                        <div className="flex gap-2">
                             <input type="text" placeholder="Kode Promo" className="flex-1 bg-transparent border-b border-ink-200 py-3 outline-none focus:border-accent-500"
                                value={form.kode_promo} onChange={e => setForm({...form, kode_promo: e.target.value})} />
                             <button onClick={checkPromo} className="text-fs-index font-mono uppercase bg-ink-200 px-4">Validasi</button>
                        </div>
                        {promo && <p className="text-accent-500 font-mono text-fs-index">Promo Aktif: {promo.nama_diskon} ({promo.persentase_diskon}%)</p>}
                        
                        <div className="pt-4 border-t border-ink-200 space-y-2">
                            <div className="flex justify-between text-ink-600">
                                <span>Harga Asli</span>
                                <span>Rp{(space ? space.harga_per_jam * form.durasi_jam : 0).toLocaleString()}</span>
                            </div>
                            {promo && (
                                <div className="flex justify-between text-status-danger">
                                    <span>Potongan ({promo.persentase_diskon}%)</span>
                                    <span>-Rp{Math.floor((space ? space.harga_per_jam * form.durasi_jam : 0) * (promo.persentase_diskon / 100)).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-ink-950 font-bold border-t border-ink-200 pt-2">
                                <span>Total Harus Bayar</span>
                                <span>
                                    Rp{(promo 
                                        ? (space ? space.harga_per_jam * form.durasi_jam : 0) - Math.floor((space ? space.harga_per_jam * form.durasi_jam : 0) * (promo.persentase_diskon / 100))
                                        : (space ? space.harga_per_jam * form.durasi_jam : 0)
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => {
                            const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-nav-btn');
                            stepperButtons[2]?.click();
                        }} className="w-full bg-ink-950 text-paper-100 py-3 font-bold hover:bg-ink-800">Lanjut ke Konfirmasi</button>
                    </div>
                )}
                {step === 'konfirmasi' && (
                    <div className="space-y-6">
                         <label className="block text-fs-index font-mono text-ink-600 uppercase tracking-widest">[03] Konfirmasi</label>
                         <p className="text-ink-950">Pastikan data sudah benar sebelum lanjut.</p>
                         {error && <div className="p-4 border border-status-danger text-status-danger text-fs-index">{error}</div>}
                         <button 
                            onClick={submitReservasi}
                            disabled={!avail?.available || submitting}
                            className="w-full bg-ink-950 text-paper-100 py-4 font-bold disabled:bg-ink-600 hover:bg-ink-800"
                        >
                          {submitting ? "[ memproses… ]" : "Konfirmasi Reservasi"}
                        </button>
                    </div>
                )}
            </div>
        )} />
      </div>
    </MemberShell>
  );
}
