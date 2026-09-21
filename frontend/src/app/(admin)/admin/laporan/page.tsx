'use client'
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { RevenueChart } from "@/components/interactive/charts/revenue-chart";
import { AnimatedPrice } from "@/components/interactive/animated-price";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

interface ReportResponse {
    total_pendapatan: number;
    breakdown?: {
        desk: number;
        meeting_room: number;
        private_office: number;
    };
    daily_data: { day: string; total: number }[];
}

export default function LaporanPage() {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    apiClient.get<ReportResponse>("/admin/reports/monthly").then(res => {
        setData(res.data);
        setLoading(false);
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-12 font-mono text-ink-600">[ memuat… ]</div>;
  if (!data) return <div className="p-12 font-mono text-ink-600">Data tidak tersedia.</div>;

  return (
    <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
      <div className="flex justify-between items-end mb-12">
        <h1 className="font-display text-fs-h1 text-ink-950">Laporan</h1>
        <MagneticHover>
            <button onClick={fetchData} className="px-6 py-2 border border-ink-600 font-mono text-xs uppercase tracking-widest text-ink-950 hover:bg-ink-950 hover:text-paper-100 transition-colors">
                [ REFRESH ]
            </button>
        </MagneticHover>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <RevenueChart data={data.daily_data} />
        <div className="border border-ink-200 bg-paper-050 p-8 relative">
            <span className="font-mono text-fs-index text-ink-600 block mb-8">[10] Breakdown Tipe Space</span>
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-ink-200 pb-2">
                    <span className="text-ink-600 text-fs-body">Desk</span>
                    <span className="font-bold text-ink-950 tabular-nums"><AnimatedPrice value={data.breakdown?.desk ?? 0} /></span>
                </div>
                <div className="flex justify-between items-center border-b border-ink-200 pb-2">
                    <span className="text-ink-600 text-fs-body">Meeting Room</span>
                    <span className="font-bold text-ink-950 tabular-nums"><AnimatedPrice value={data.breakdown?.meeting_room ?? 0} /></span>
                </div>
                <div className="flex justify-between items-center border-b border-ink-200 pb-2">
                    <span className="text-ink-600 text-fs-body">Private Office</span>
                    <span className="font-bold text-ink-950 tabular-nums"><AnimatedPrice value={data.breakdown?.private_office ?? 0} /></span>
                </div>
                <div className="pt-4 flex justify-between items-center">
                    <span className="font-bold text-ink-950 text-xl font-display">Total Pendapatan</span>
                    <span className="font-bold text-ink-950 tabular-nums text-xl font-display"><AnimatedPrice value={data.total_pendapatan} /></span>
                </div>
            </div>
            {/* Crop-marks */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos) => (
                <span
                key={pos}
                aria-hidden
                className={`absolute ${pos} z-10 h-3 w-3 border-accent-500`}
                style={{ 
                    borderTop: pos.includes('top') ? '1px solid currentColor' : 'none',
                    borderBottom: pos.includes('bottom') ? '1px solid currentColor' : 'none',
                    borderLeft: pos.includes('left') ? '1px solid currentColor' : 'none',
                    borderRight: pos.includes('right') ? '1px solid currentColor' : 'none',
                }}
                />
            ))}
        </div>
      </div>
    </div>
  );
}
