'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { type Space } from "@/types/api";
import { MagneticHover } from "@/components/interactive/magnetic-hover";
import Image from "next/image";

export default function SpaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get<Space>(`/spaces/${id}`)
      .then((res) => setSpace(res.data))
      .catch((err) => {
        console.error(err);
        router.replace("/spaces");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <MemberShell><div className="p-12 text-ink-600 font-mono">[ memuat… ]</div></MemberShell>;
  if (!space) return null;

  return (
    <MemberShell>
      <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
          <div className="grid md:grid-cols-2 border border-ink-200 bg-paper-050">
            {space.foto_url ? (
              <Image src={space.foto_url} alt={space.nama_space} className="w-full aspect-square object-cover" width={800} height={800} />
            ) : (
              <div className="w-full aspect-square bg-paper-200 flex items-center justify-center text-ink-400">
                <span>[ no photo ]</span>
              </div>
            )}
            
            <div className="flex flex-col p-8 md:p-12 border-l border-ink-200">
              <h1 className="font-display text-4xl text-ink-950">{space.nama_space}</h1>
              <p className="mt-4 text-2xl font-bold font-display text-accent-500 tabular-nums">
                Rp{space.harga_per_jam.toLocaleString()}/jam
              </p>

              <div className="mt-8 space-y-4 font-body text-ink-950">
                <p className="flex justify-between border-b border-ink-200 py-2"><span>Tipe</span> <span className="font-bold capitalize">{space.tipe.replace('_', ' ')}</span></p>
                <p className="flex justify-between border-b border-ink-200 py-2"><span>Kapasitas</span> <span className="font-bold">{space.kapasitas} orang</span></p>
                <p className="leading-relaxed text-ink-600 py-4">{space.deskripsi}</p>
              </div>
              
              <div className="mt-auto pt-8 border-t border-ink-200 text-fs-index text-ink-600">
                 Dikelola oleh: {space.owner.nama_coworking} — {space.owner.nama_pemilik}
              </div>

              <MagneticHover className="mt-8">
                <button
                    onClick={() => router.push(`/reservasi/baru?id_space=${space.id}`)}
                    className="w-full bg-accent-500 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-accent-500/90"
                >
                    Pesan Sekarang
                </button>
              </MagneticHover>
            </div>
          </div>
      </div>
    </MemberShell>
  );
}
