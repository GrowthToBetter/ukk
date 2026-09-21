<?php

use App\Http\Controllers\Api\Admin\DiskonController as AdminDiskonController;
use App\Http\Controllers\Api\Admin\MemberController as AdminMemberController;
use App\Http\Controllers\Api\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Api\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\Admin\ReservasiController as AdminReservasiController;
use App\Http\Controllers\Api\Admin\SpaceController as AdminSpaceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DiskonController;
use App\Http\Controllers\Api\MakerController;
use App\Http\Controllers\Api\ReservasiController;
use App\Http\Controllers\Api\SpaceController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ResolveMakerKey;
use Illuminate\Support\Facades\Route;

// Root & Health (Publik murni)
Route::get('/', function () {
    return response()->json([
        'status' => true,
        'statusCode' => 200,
        'message' => 'Smart Space Booking API',
        'data' => ['version' => '1.0.0', 'timestamp' => now()->toIso8601String()],
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.root');

Route::get('/health', function () {
    return response()->json([
        'status' => true,
        'statusCode' => 200,
        'message' => 'API is healthy',
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.health');

// App Maker (Multi-Tenancy) — Publik murni, tanpa ResolveMakerKey
Route::prefix('maker')->group(function () {
    Route::post('/register', [MakerController::class, 'register'])->name('maker.register');
    Route::post('/login', [MakerController::class, 'login'])->name('maker.login');
    Route::get('/list', [MakerController::class, 'list'])->name('maker.list');

    // Butuh Sanctum token Maker
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [MakerController::class, 'me'])->name('maker.me');
    });

    // Butuh x-maker-key header
    Route::middleware(ResolveMakerKey::class)->group(function () {
        Route::get('/stats', [MakerController::class, 'stats'])->name('maker.stats');
    });
});

// Semua route di bawah ini WAJIB x-maker-key header
Route::middleware(ResolveMakerKey::class)->group(function () {

    // Auth User (Member & Admin Space)
    Route::prefix('auth')->group(function () {
        Route::post('/register/member', [AuthController::class, 'registerMember'])->name('auth.register.member');
        Route::post('/register/admin-space', [AuthController::class, 'registerAdminSpace'])->name('auth.register.admin-space');
        Route::post('/login', [AuthController::class, 'login'])->name('auth.login');

        // Butuh Sanctum token User + x-maker-key
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/profile', [AuthController::class, 'profile'])->name('auth.profile');
        });
    });

    // Space (Katalog & Ketersediaan)
    Route::prefix('spaces')->group(function () {
        Route::get('/types', [SpaceController::class, 'types'])->name('spaces.types');
        Route::get('/owners', [\App\Http\Controllers\Api\SpaceOwnerController::class, 'index'])->name('spaces.owners');
        Route::get('/availability', [SpaceController::class, 'availability'])->name('spaces.availability');
        Route::get('/', [SpaceController::class, 'index'])->name('spaces.index');
        Route::get('/{id}', [SpaceController::class, 'show'])->name('spaces.show');
    });

    // Diskon
    Route::prefix('diskon')->group(function () {
        Route::get('/active', [DiskonController::class, 'active'])->name('diskon.active');
        Route::post('/check', [DiskonController::class, 'check'])->name('diskon.check');
        Route::get('/{id}', [DiskonController::class, 'show'])->name('diskon.show');
    });

    // Admin
    Route::prefix('admin')->middleware(['auth:sanctum', CheckRole::class.':admin_space'])->group(function () {
        Route::get('/profile', [AdminProfileController::class, 'show'])->name('admin.profile.show');
        Route::put('/profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');

        Route::prefix('members')->group(function () {
            Route::get('/', [AdminMemberController::class, 'index'])->name('admin.members.index');
            Route::post('/', [AdminMemberController::class, 'store'])->name('admin.members.store');
            Route::get('/{id}', [AdminMemberController::class, 'show'])->name('admin.members.show');
            Route::put('/{id}', [AdminMemberController::class, 'update'])->name('admin.members.update');
            Route::patch('/{id}/status', [AdminMemberController::class, 'updateStatus'])->name('admin.members.updateStatus');
            Route::delete('/{id}', [AdminMemberController::class, 'destroy'])->name('admin.members.destroy');
        });

        Route::prefix('spaces')->group(function () {
            Route::get('/', [AdminSpaceController::class, 'index'])->name('admin.spaces.index');
            Route::post('/', [AdminSpaceController::class, 'store'])->name('admin.spaces.store');
            Route::get('/{id}', [AdminSpaceController::class, 'show'])->name('admin.spaces.show');
            Route::put('/{id}', [AdminSpaceController::class, 'update'])->name('admin.spaces.update');
            Route::delete('/{id}', [AdminSpaceController::class, 'destroy'])->name('admin.spaces.destroy');
        });

        Route::prefix('diskon')->group(function () {
            Route::get('/', [AdminDiskonController::class, 'index'])->name('admin.diskon.index');
            Route::post('/', [AdminDiskonController::class, 'store'])->name('admin.diskon.store');
            Route::get('/{id}', [AdminDiskonController::class, 'show'])->name('admin.diskon.show');
            Route::put('/{id}', [AdminDiskonController::class, 'update'])->name('admin.diskon.update');
            Route::delete('/{id}', [AdminDiskonController::class, 'destroy'])->name('admin.diskon.destroy');
        });

        Route::prefix('reservasi')->group(function () {
            Route::get('/', [AdminReservasiController::class, 'index'])->name('admin.reservasi.index');
            Route::patch('/{id}/status', [AdminReservasiController::class, 'updateStatus'])->name('admin.reservasi.updateStatus');
            Route::post('/{id}/check-in', [AdminReservasiController::class, 'checkIn'])->name('admin.reservasi.checkIn');
            Route::post('/{id}/check-out', [AdminReservasiController::class, 'checkOut'])->name('admin.reservasi.checkOut');
        });

        Route::prefix('reports')->group(function () {
            Route::get('/monthly', [AdminReportController::class, 'monthly'])->name('admin.reports.monthly');
            Route::get('/income', [AdminReportController::class, 'income'])->name('admin.reports.income');
        });
    });
    Route::prefix('reservasi')->middleware('auth:sanctum')->group(function () {

        // Khusus member
        Route::middleware(CheckRole::class.':member')->group(function () {
            Route::post('/', [ReservasiController::class, 'store'])->name('reservasi.store');
            Route::post('/{id}/bukti-bayar', [ReservasiController::class, 'uploadBuktiBayar'])->name('reservasi.upload-bukti-bayar');
            Route::get('/my', [ReservasiController::class, 'myReservations'])->name('reservasi.my');
            Route::get('/my/history', [ReservasiController::class, 'myHistory'])->name('reservasi.my.history');
            Route::patch('/{id}/cancel', [ReservasiController::class, 'cancel'])->name('reservasi.cancel');
        });

        // Boleh member (pemilik) atau admin_space (pemilik space) — dicek di controller
        Route::get('/{id}/e-ticket', [ReservasiController::class, 'eTicket'])->name('reservasi.eticket');
        Route::get('/{id}', [ReservasiController::class, 'show'])->name('reservasi.show');
    });

    // Upload (x-maker-key saja, tidak perlu Bearer)
    Route::prefix('upload')->group(function () {
        Route::post('/image', [UploadController::class, 'image'])->name('upload.image');
        Route::post('/spaces', [UploadController::class, 'spaces'])->name('upload.spaces');
        Route::post('/members', [UploadController::class, 'members'])->name('upload.members');
        Route::post('/bukti-bayar', [UploadController::class, 'buktiBayar'])->name('upload.bukti-bayar');
    });
});
