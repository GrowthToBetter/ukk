import { DiskonForm } from "@/components/interactive/diskon-form";

export default function CreateDiskonPage() {
    return (
        <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
            <h1 className="font-display text-fs-h2 text-ink-950 mb-12">Tambah Diskon Baru</h1>
            <DiskonForm />
        </div>
    );
}
