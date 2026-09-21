"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { type Diskon, type AdminDiskonListResponse } from "@/types/api";
import { AdminAccordionRow } from "@/components/interactive/admin-accordion-row";
import { MagneticHover } from "@/components/interactive/magnetic-hover";
import Link from "next/link";

export default function DiskonPage() {
  const router = useRouter();
  const [diskons, setDiskons] = useState<Diskon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get<AdminDiskonListResponse>("/admin/diskon");
    setDiskons(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const deleteDiskon = async (id: number) => {
    if (confirm("Yakin hapus diskon?")) {
      await apiClient.del(`/admin/diskon/${id}`);
      await fetchData();
    }
  };

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <h1 className="font-display text-fs-h2 text-ink-950">Data Diskon</h1>
        <MagneticHover>
            <button
                onClick={() => router.push("/admin/diskon/create")}
                className="px-6 py-2 border border-ink-600 font-mono text-xs uppercase tracking-widest text-ink-950 hover:bg-ink-950 hover:text-paper-100 transition-colors"
            >
                [ + TAMBAH DISKON ]
            </button>
        </MagneticHover>
      </div>
      
      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : diskons.length === 0 ? (
        <p className="text-ink-600 font-body">Belum ada diskon terdaftar.</p>
      ) : (
        <div className="border-t border-ink-200">
            {diskons.map((d, i) => (
                <AdminAccordionRow 
                    key={d.id}
                    index={i + 1}
                    title={d.nama_diskon}
                    subtitle={`${d.persentase_diskon}% OFF`}
                >
                    <div className="p-4 space-y-4 text-ink-600 font-body">
                        <p>Status: <span className={d.is_active ? "text-accent-500 font-bold" : "text-status-danger"}>{d.is_active ? "Aktif" : "Nonaktif"}</span></p>
                        <p>Periode: {new Date(d.tanggal_awal).toLocaleDateString()} - {new Date(d.tanggal_akhir).toLocaleDateString()}</p>
                        <div className="flex gap-4 mt-4">
                            <Link href={`/admin/diskon/${d.id}/edit`} className="text-accent-500 underline">[ Edit Diskon ]</Link>
                            <button onClick={() => deleteDiskon(d.id)} className="text-status-danger underline">[ Hapus Diskon ]</button>
                        </div>
                    </div>
                </AdminAccordionRow>
            ))}
        </div>
      )}
    </div>
  );
}
