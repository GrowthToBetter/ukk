<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a success JSON response.
     */
    protected function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => true,
            'statusCode' => $statusCode,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ], $statusCode);
    }

    /**
     * Return an error JSON response.
     */
    protected function error(string $message = 'Error', int $statusCode = 400, ?string $error = null): JsonResponse
    {
        $errorName = $error ?? $this->getErrorNameFromStatusCode($statusCode);

        return response()->json([
            'status' => false,
            'statusCode' => $statusCode,
            'message' => $message,
            'error' => $errorName,
            'timestamp' => now()->toIso8601String(),
        ], $statusCode);
    }

    /**
     * Get error name from HTTP status code.
     */
    private function getErrorNameFromStatusCode(int $statusCode): string
    {
        return match ($statusCode) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            409 => 'Conflict',
            422 => 'Unprocessable Entity',
            500 => 'Internal Server Error',
            default => 'Error',
        };
    }
}
