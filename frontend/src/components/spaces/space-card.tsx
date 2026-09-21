import { EvidenceCard } from "../interactive/evidence-card";
import { type Space } from "@/types/api";

export function SpaceCard({ index, space }: { index: number; space: Space }) {
    return (
        <EvidenceCard
            index={index}
            title={space.nama_space}
            meta={`${space.tipe.replace('_', ' ')} | ${space.kapasitas} orang | Rp${space.harga_per_jam.toLocaleString()}/jam`}
            image={space.foto_url || undefined}
            action={{ label: "Lihat Detail", href: `/spaces/${space.id}` }}
            variant={index % 2 === 0 ? "dark" : "light"}
        >
            <p className="line-clamp-2">{space.deskripsi}</p>
        </EvidenceCard>
    );
}
