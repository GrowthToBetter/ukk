"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Member } from "@/types/api";
import { apiClient } from "@/lib/api-client";
import { MemberForm } from "@/components/interactive/member-form";

export default function EditMemberPage() {
    const params = useParams();
    const id = params.id as string;
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<Member>(`/admin/members/${id}`).then(res => {
            setMember(res.data);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-12 font-mono text-ink-600">[ memuat… ]</div>;
    if (!member) return <div className="p-12 font-mono text-status-danger">Member tidak ditemukan</div>;

    return (
        <div className="p-4 md:p-12 bg-paper-100 min-h-screen">
            <h1 className="font-display text-fs-h2 text-ink-950 mb-12">Edit Member</h1>
            <MemberForm initialData={member} isEdit />
        </div>
    );
}
