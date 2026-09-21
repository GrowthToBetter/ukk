<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UploadRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Cloudinary\Cloudinary;

class UploadController extends Controller
{
    use ApiResponse;

    /**
     * Upload bukti bayar ke Cloudinary folder 'bukti-bayar'.
     */
    public function buktiBayar(UploadRequest $request): JsonResponse
    {
        return $this->handleUpload($request, 'bukti-bayar');
    }

    /**
     * Upload gambar umum ke storage/app/public/images.
     */
    public function image(UploadRequest $request): JsonResponse
    {
        return $this->handleUpload($request, 'images');
    }

    /**
     * Upload foto ruangan/space ke storage/app/public/spaces.
     */
    public function spaces(UploadRequest $request): JsonResponse
    {
        return $this->handleUpload($request, 'spaces');
    }

    /**
     * Upload foto profil member ke storage/app/public/members.
     */
    public function members(UploadRequest $request): JsonResponse
    {
        return $this->handleUpload($request, 'members');
    }

    /**
     * Proses upload, simpan ke sub-direktori yang ditentukan,
     * kembalikan filename dan url publik.
     */
    private function handleUpload(UploadRequest $request, string $directory): JsonResponse
    {
        $file = $request->file('file');

        try {
            $cloudinary = new Cloudinary(env('CLOUDINARY_URL'));
            $result = $cloudinary->uploadApi()->upload($file->getRealPath(), [
                'folder' => $directory,
            ]);

            $url = $result['secure_url'];
            $filename = $result['public_id'];

            return $this->success([
                'filename' => $filename,
                'url' => $url,
                'path' => $result['public_id'],
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ], 'File berhasil diupload', 201);

        } catch (\Exception $e) {
            \Log::error('Cloudinary upload error: ' . $e->getMessage());
            return $this->error('Gagal mengupload ke cloud storage: ' . $e->getMessage(), 503);
        }
    }
}
