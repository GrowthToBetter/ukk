"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Space } from "@/types/api";
import { apiClient } from "@/lib/api-client";
import { SpaceForm } from "@/components/interactive/space-form";

export default function EditSpacePage() {
    const params = useParams();
    const id = params.id as string;
    const [space, setSpace] = useState<Space | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<Space>(`/admin/spaces/${id}`).then(res => {
            setSpace(res.data);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-12 font-mono text-ink-600">[ memuat… ]</div>;
    if (!space) return <div className="p-12 font-mono text-status-danger">Space tidak ditemukan</div>;

    return (
        <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
            <h1 className="font-display text-fs-h2 text-ink-950 mb-12">Edit Space</h1>
            <SpaceForm initialData={space} isEdit />
        </div>
    );
}
