"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Space, CreateSpaceDto, UpdateSpaceDto, TipeSpace } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { ImageUpload } from '@/components/interactive/image-upload';

interface SpaceFormProps {
    initialData?: Space;
    isEdit?: boolean;
}

export const SpaceForm: React.FC<SpaceFormProps> = ({ initialData, isEdit }) => {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<CreateSpaceDto>({
        nama_space: initialData?.nama_space || '',
        harga_per_jam: initialData?.harga_per_jam || 0,
        tipe: initialData?.tipe || 'desk',
        kapasitas: initialData?.kapasitas || 1,
        deskripsi: initialData?.deskripsi || '',
        foto: initialData?.foto || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (isEdit && initialData) {
                await apiClient.put<Space>(`/admin/spaces/${initialData.id}`, form);
            } else {
                await apiClient.post<Space>('/admin/spaces', form);
            }
            router.push('/admin/spaces');
            router.refresh(); // Refresh route to update list
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-paper-100 p-8 border border-ink-200">
            {error && <div className="p-4 border border-status-danger text-status-danger font-mono text-sm">{error}</div>}
            
            <div>
                <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Nama Space</label>
                <input required value={form.nama_space} onChange={e => setForm({...form, nama_space: e.target.value})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Harga / Jam</label>
                    <input type="number" required value={form.harga_per_jam} onChange={e => setForm({...form, harga_per_jam: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
                <div>
                    <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Kapasitas</label>
                    <input type="number" required value={form.kapasitas} onChange={e => setForm({...form, kapasitas: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none focus:border-accent-500" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Tipe</label>
                <select value={form.tipe} onChange={e => setForm({...form, tipe: e.target.value as TipeSpace})} className="w-full bg-transparent border-b border-ink-600 py-2 outline-none">
                    <option value="desk">Desk</option>
                    <option value="meeting_room">Meeting Room</option>
                    <option value="private_office">Private Office</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-mono text-ink-600 uppercase tracking-widest mb-2">Deskripsi</label>
                <textarea required value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className="w-full bg-transparent border border-ink-600 p-2 outline-none focus:border-accent-500 h-24" />
            </div>

            <ImageUpload 
                label="Foto Space"
                initialUrl={initialData?.foto_url || undefined}
                onUpload={(filename) => setForm({...form, foto: filename})}
            />

            <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-ink-950 py-4 text-xs font-mono text-paper-100 uppercase tracking-[0.2em] hover:bg-ink-800 disabled:opacity-50"
            >
                {submitting ? '[ memproses… ]' : isEdit ? '[ PERBARUI SPACE ]' : '[ TAMBAH SPACE ]'}
            </button>
        </form>
    );
};
