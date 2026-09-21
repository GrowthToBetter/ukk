"use client";

import Image from "next/image";

interface BuktiBayarPreviewProps {
  url: string;
  status: string;
  canReplace?: boolean;
  onReplace?: () => void;
}

export function BuktiBayarPreview({ url, status, canReplace, onReplace }: BuktiBayarPreviewProps) {
  return (
    <div className="space-y-4">
      <Image src={url} alt="Bukti Bayar" className="w-full max-h-60 object-contain border border-ink-200" width={800} height={600} />
      <div className="flex justify-between items-center">
        {status === 'belum_dikonfirm' && (
          <p className="text-accent-500 font-mono text-fs-index">[ Menunggu verifikasi admin ]</p>
        )}
        {canReplace && (
          <button 
            onClick={onReplace} 
            className="text-ink-600 font-mono text-xs underline hover:text-ink-950"
          >
            [ Ganti Bukti Bayar ]
          </button>
        )}
      </div>
    </div>
  );
}
