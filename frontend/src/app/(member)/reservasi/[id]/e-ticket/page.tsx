"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MemberShell } from "@/components/MemberShell";
import { apiClient } from "@/lib/api-client";
import { type ETicket } from "@/types/api";
import { QRCodeSVG } from "qrcode.react";
import { MagneticHover } from "@/components/interactive/magnetic-hover";

export default function ETicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<ETicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        const ticketId = Array.isArray(id) ? id[0] : id;
        void apiClient.get<ETicket>(`/reservasi/${ticketId}/e-ticket`)
            .then(r => setTicket(r.data))
            .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <MemberShell><div className="p-12 text-ink-600 font-mono">[ memuat… ]</div></MemberShell>;
  if (!ticket) return null;

  return (
    <MemberShell>
      <div className="p-4 md:p-12 bg-paper-100 min-h-screen flex justify-center items-start">
        <div className="w-full max-w-sm bg-paper-050 border border-ink-200 p-8">
            <h1 className="font-display text-2xl text-ink-950 mb-8 border-b border-ink-200 pb-4">E-Ticket</h1>
            
            <div className="flex justify-center my-12">
                <QRCodeSVG value={ticket.qr_code_payload} size={200} includeMargin={true} />
            </div>
            
            <div className="space-y-4 font-body text-ink-950 text-center">
                <p className="font-display text-xl">{ticket.kode_booking}</p>
                <p className="border-t border-ink-200 pt-4 text-ink-600">{ticket.space.nama_space}</p>
                <p className="text-ink-600 tabular-nums">{ticket.tanggal_reservasi} • {ticket.jam_mulai} - {ticket.jam_selesai}</p>
            </div>

            <MagneticHover className="mt-12">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-ink-950 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-ink-800"
                >
                    [ UNDUH TIKET ]
                </button>
            </MagneticHover>
        </div>
      </div>
    </MemberShell>
  );
}
