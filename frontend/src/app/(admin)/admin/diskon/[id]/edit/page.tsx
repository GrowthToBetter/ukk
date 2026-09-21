"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Diskon } from "@/types/api";
import { apiClient } from "@/lib/api-client";
import { DiskonForm } from "@/components/interactive/diskon-form";

export default function EditDiskonPage() {
    const params = useParams();
    const id = params.id as string;
    const [diskon, setDiskon] = useState<Diskon | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<Diskon>(`/admin/diskon/${id}`).then(res => {
            setDiskon(res.data);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-12 font-mono text-ink-600">[ memuat… ]</div>;
    if (!diskon) return <div className="p-12 font-mono text-status-danger">Diskon tidak ditemukan</div>;

    return (
        <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
            <h1 className="font-display text-fs-h2 text-ink-950 mb-12">Edit Diskon</h1>
            <DiskonForm initialData={diskon} isEdit />
        </div>
    );
}
