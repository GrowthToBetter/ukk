"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Member, CreateMemberByAdminDto, UpdateMemberDto } from '@/types/api';
import { apiClient } from '@/lib/api-client';

interface MemberFormProps {
    initialData?: Member;
    isEdit?: boolean;
}

export const MemberForm: React.FC<MemberFormProps> = ({ initialData, isEdit }) => {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<CreateMemberByAdminDto>({
        username: '',
        password: '',
        nama_member: initialData?.nama_member || '',
        instansi: initialData?.instansi || '',
        alamat: initialData?.alamat || '',
        telp: initialData?.telp || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (isEdit && initialData) {
                const updateData: UpdateMemberDto = {
                    nama_member: form.nama_member,
                    instansi: form.instansi,
                    alamat: form.alamat,
                    telp: form.telp,
                };
                await apiClient.put<Member>(`/admin/members/${initialData.id}`, updateData);
            } else {
                await apiClient.post<Member>('/admin/members', form);
            }
            router.push('/admin/members');
            router.refresh();
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Gagal menyimpan member');
            } finally {

            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-paper-100 p-8 border border-ink-200">
            {error && <div className="p-4 border border-status-danger text-status-danger font-mono text-sm">{error}</div>}
            
            <div>
                <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Nama Member</label>
                <input required value={form.nama_member} onChange={e => setForm({...form, nama_member: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                     <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Instansi</label>
                     <input required value={form.instansi} onChange={e => setForm({...form, instansi: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
                <div>
                     <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Telepon</label>
                     <input required value={form.telp} onChange={e => setForm({...form, telp: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
            </div>

            <div>
                 <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Alamat</label>
                 <textarea required value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} className="w-full bg-transparent border border-ink-600 p-2 outline-none focus:border-accent-500 h-24" />
            </div>

            {!isEdit && (
                <>
                    <div>
                        <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Username</label>
                        <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Password</label>
                        <input type="password" required={!isEdit} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                    </div>
                </>
            )}

            <button                type="submit" 
                disabled={submitting}
                className="w-full bg-ink-950 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-ink-800 disabled:opacity-50"
            >
                {submitting ? '[ memproses… ]' : isEdit ? '[ PERBARUI MEMBER ]' : '[ TAMBAH MEMBER ]'}
            </button>
        </form>
    );
};
