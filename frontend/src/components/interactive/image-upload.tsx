import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UploadResult } from '@/types/api';

interface ImageUploadProps {
    onUpload: (filename: string, url: string) => void;
    initialUrl?: string;
    label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, initialUrl, label = "Upload Foto" }) => {
    const [preview, setPreview] = useState<string | null>(initialUrl || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            setError('Ukuran maksimal 2MB');
            return;
        }

        setError(null);
        setLoading(true);
        setPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Fix: Use dedicated uploadFile method which handles FormData multipart correctly
            const response = await apiClient.uploadFile<UploadResult>('/upload/spaces', file);
            onUpload(response.data.filename, response.data.url);
        } catch (err) {
            setError('Gagal mengupload gambar');
            setPreview(initialUrl || null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-xs font-mono text-ink-200 uppercase tracking-widest">{label}</label>
            {preview && (
                <img src={preview} alt="Preview" className="h-32 w-32 object-cover border border-ink-600" />
            )}
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full text-sm text-ink-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-accent-500 file:text-paper-100 hover:file:bg-accent-500/90"
            />
            {loading && <p className="text-xs font-mono text-ink-600">[ mengupload… ]</p>}
            {error && <p className="text-xs font-mono text-status-danger">{error}</p>}
        </div>
    );
};
