"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { type Space, type AdminSpacesListResponse } from "@/types/api";
import { AdminAccordionRow } from "@/components/interactive/admin-accordion-row";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiClient.get<AdminSpacesListResponse>("/admin/spaces");
    setSpaces(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const deleteSpace = async (id: number) => {
    if (confirm("Yakin hapus space?")) {
      await apiClient.del(`/admin/spaces/${id}`);
      await fetchData();
    }
  };

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <h1 className="font-display text-fs-h2 text-ink-950">Data Space</h1>
        <MagneticHover>
            <button 
                onClick={() => router.push("/admin/spaces/create")}
                className="px-6 py-2 border border-ink-600 font-mono text-xs uppercase tracking-widest text-ink-950 hover:bg-ink-950 hover:text-paper-100 transition-colors"
            >
                [ + TAMBAH SPACE ]
            </button>
        </MagneticHover>
      </div>
      
      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : spaces.length === 0 ? (
        <p className="text-ink-600 font-body">Belum ada space terdaftar.</p>
      ) : (
        <div className="border-t border-ink-200">
            {spaces.map((s, i) => (
                <AdminAccordionRow 
                    key={s.id}
                    index={i + 1}
                    title={s.nama_space}
                    subtitle={s.tipe.replace('_', ' ')}
                    thumbnail={s.foto_url || undefined}
                >
                    <div className="p-4 space-y-4 text-ink-600 font-body">
                        <p>Deskripsi: {s.deskripsi}</p>
                        <p>Harga: Rp{s.harga_per_jam.toLocaleString()}/jam</p>
                        <p>Kapasitas: {s.kapasitas} orang</p>
                        <div className="flex gap-4">
                            <button onClick={() => router.push(`/admin/spaces/${s.id}/edit`)} className="text-accent-500 underline">[ Edit Space ]</button>
                            <button onClick={() => deleteSpace(s.id)} className="text-status-danger underline">[ Hapus Space ]</button>
                        </div>
                    </div>
                </AdminAccordionRow>
            ))}
        </div>
      )}
    </div>
  );
}
