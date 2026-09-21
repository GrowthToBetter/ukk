"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Diskon, CreateDiskonDto } from '@/types/api';
import { apiClient } from '@/lib/api-client';

interface DiskonFormProps {
    initialData?: Diskon;
    isEdit?: boolean;
}

export const DiskonForm: React.FC<DiskonFormProps> = ({ initialData, isEdit }) => {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<CreateDiskonDto>({
        nama_diskon: initialData?.nama_diskon || '',
        persentase_diskon: initialData?.persentase_diskon || 0,
        tanggal_awal: initialData?.tanggal_awal.split('T')[0] || '',
        tanggal_akhir: initialData?.tanggal_akhir.split('T')[0] || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (form.persentase_diskon <= 0 || form.persentase_diskon > 100) {
            setError("Persentase diskon harus antara 1-100");
            setSubmitting(false);
            return;
        }

        if (new Date(form.tanggal_awal) >= new Date(form.tanggal_akhir)) {
            setError("Tanggal akhir harus setelah tanggal awal");
            setSubmitting(false);
            return;
        }

        try {
            if (isEdit && initialData) {
                await apiClient.put<Diskon>(`/admin/diskon/${initialData.id}`, form);
            } else {
                await apiClient.post<Diskon>('/admin/diskon', form);
            }
            router.push('/admin/diskon');
            router.refresh();
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Gagal menyimpan diskon');
            } finally {

            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-paper-100 p-8 border border-ink-200">
            {error && <div className="p-4 border border-status-danger text-status-danger font-mono text-sm">{error}</div>}
            
            <div>
                <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Nama Diskon</label>
                <input required value={form.nama_diskon} onChange={e => setForm({...form, nama_diskon: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                     <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Persentase (%)</label>
                     <input type="number" required value={form.persentase_diskon} onChange={e => setForm({...form, persentase_diskon: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Tanggal Awal</label>
                    <input type="date" required value={form.tanggal_awal} onChange={e => setForm({...form, tanggal_awal: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
                <div>
                    <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Tanggal Akhir</label>
                    <input type="date" required value={form.tanggal_akhir} onChange={e => setForm({...form, tanggal_akhir: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-ink-950 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-ink-800 disabled:opacity-50"
            >
                {submitting ? '[ memproses… ]' : isEdit ? '[ PERBARUI DISKON ]' : '[ TAMBAH DISKON ]'}
            </button>
        </form>
    );
};
