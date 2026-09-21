'use client'
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { type Space, type SpacesListResponse, type TipeSpace } from "@/types/api";
import { SpaceCard } from "@/components/spaces/space-card";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipe, setTipe] = useState<TipeSpace | "">("");

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<SpacesListResponse>("/spaces", { tipe: tipe || undefined });
      setSpaces(res.data.spaces);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat space");
    } finally {
      setLoading(false);
    }
  }, [tipe]);

  useEffect(() => { fetchSpaces() }, [fetchSpaces]);

  return (
    <MemberShell>
      <div className="p-4 md:p-12 min-h-screen">
        <div className="mb-12">
            <span className="font-mono text-fs-index text-ink-600 block mb-4">[ TIER 1 — PUBLIC ]</span>
            <h1 className="font-display text-fs-h1 text-ink-950">Katalog Space</h1>
        </div>
        
        <div className="flex flex-wrap gap-8 mb-12 font-mono text-fs-index border-b border-ink-200 pb-4">
          {(["", "desk", "meeting_room", "private_office"] as const).map((t) => (
            <button key={t} onClick={() => setTipe(t === "" ? "" : t as TipeSpace)} className={`relative pb-4 -mb-[17px] ${tipe === t ? 'text-ink-950' : 'text-ink-600'} hover:text-ink-950`}>
              {tipe === t && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-500" />}
              {t === "" ? "Semua" : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
             <span className="font-mono text-fs-index text-ink-600">[ memuat… ]</span>
        ) : error ? (
            <div className="border border-status-danger p-4 text-ink-950 bg-paper-050 mb-8">{error}</div>
        ) : spaces.length === 0 ? (
            <div className="flex flex-col gap-2">
                <p className="text-ink-600 font-body">Space tidak ditemukan. <button onClick={() => setTipe("")} className="text-accent-500 underline font-bold transition hover:text-accent-500/80">[ Reset filter → ]</button></p>
            </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
                {spaces.map((space, i) => (
                <motion.div key={space.id} layout>
                    <SpaceCard index={i+1} space={space} />
                </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </MemberShell>
  );
}
