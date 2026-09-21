import { type StatusReservasi } from "@/types/api";

const STATUS_MAP = {
  belum_dikonfirm: { color: 'var(--color-status-warn)', label: 'Belum Dikonfirmasi', strike: false },
  disetujui: { color: 'var(--color-accent-500)', label: 'Disetujui', strike: false },
  aktif: { color: 'var(--color-accent-500)', label: 'Aktif', strike: false },
  selesai: { color: 'var(--color-ink-600)', label: 'Selesai', strike: false },
  dibatalkan: { color: 'var(--color-status-danger)', label: 'Dibatalkan', strike: true },
} as const;

export function StatusBadge({ status }: { status: StatusReservasi }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={`text-fs-index uppercase tabular-nums ${s.strike ? 'line-through' : ''}`}
      style={{ color: s.color }}
    >
      [{s.label}]
    </span>
  );
}

export function canBeCancelled(status: StatusReservasi): boolean {
  return status === "belum_dikonfirm" || status === "disetujui";
}
