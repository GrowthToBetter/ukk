import { SpaceForm } from "@/components/interactive/space-form";

export default function CreateSpacePage() {
    return (
        <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
            <h1 className="font-display text-fs-h2 text-ink-950 mb-12">Tambah Space Baru</h1>
            <SpaceForm />
        </div>
    );
}
