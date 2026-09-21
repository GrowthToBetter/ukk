<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Override perilaku auth default agar tidak redirect ke route [login]
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // 401 Unauthenticated — format ApiResponse standar
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => false,
                    'statusCode' => 401,
                    'message' => 'Unauthenticated',
                    'error' => 'Unauthorized',
                    'timestamp' => now()->toISOString(),
                ], 401);
            }
        });

        // 413 Payload Too Large — format ApiResponse standar
        $exceptions->render(function (PostTooLargeException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => false,
                    'statusCode' => 413,
                    'message' => 'Ukuran file terlalu besar',
                    'timestamp' => now()->toISOString(),
                ], 413);
            }
        });

        // 422 Validation — format ApiResponse standar (pesan pertama + koleksi errors)
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                $firstMessage = collect($e->errors())->flatten()->first() ?? $e->getMessage();

                return response()->json([
                    'status' => false,
                    'statusCode' => 422,
                    'message' => $firstMessage,
                    'errors' => $e->errors(),
                    'timestamp' => now()->toISOString(),
                ], 422);
            }
        });
    })->create();
