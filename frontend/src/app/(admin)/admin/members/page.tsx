"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { type Member, type AdminMembersListResponse } from "@/types/api";
import { AdminAccordionRow } from "@/components/interactive/admin-accordion-row";
import { MagneticHover } from "@/components/interactive/magnetic-hover";
import Link from "next/link";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get<AdminMembersListResponse>("/admin/members");
    setMembers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const deleteMember = async (id: number) => {
    if (confirm("Yakin hapus member?")) {
      await apiClient.del(`/admin/members/${id}`);
      await fetchData();
    }
  };

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <h1 className="font-display text-fs-h2 text-ink-950">Data Member</h1>
        <MagneticHover>
            <button className="px-6 py-2 border border-ink-600 font-mono text-xs uppercase tracking-widest text-ink-950 hover:bg-ink-950 hover:text-paper-100 transition-colors">
                [ + TAMBAH MEMBER ]
            </button>
        </MagneticHover>
      </div>

      {loading ? (
        <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
      ) : members.length === 0 ? (
        <p className="text-ink-600 font-body">Belum ada member terdaftar.</p>
      ) : (
        <div className="border-t border-ink-200">
            {members.map((m, i) => (
                <AdminAccordionRow 
                    key={m.id}
                    index={i + 1}
                    title={m.nama_member}
                    subtitle={m.instansi}
                >
                    <div className="p-4 space-y-4 text-ink-600 font-body">
                        <p>Alamat: {m.alamat}</p>
                        <p>Telp: {m.telp}</p>
                        <div className="flex gap-4 mt-4">
                            <Link href={`/admin/members/${m.id}/edit`} className="text-accent-500 underline">[ Edit Member ]</Link>
                            <button onClick={() => deleteMember(m.id)} className="text-status-danger underline">[ Hapus Member ]</button>
                        </div>
                    </div>
                </AdminAccordionRow>
            ))}
        </div>
      )}
    </div>
  );
}
