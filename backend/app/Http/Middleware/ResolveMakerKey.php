<?php

namespace App\Http\Middleware;

use App\Models\Maker;
use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveMakerKey
{
    use ApiResponse;

    /**
     * Handle an incoming request.
     * Accept both x-maker-key and x-app-key headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for x-maker-key or x-app-key header
        $makerKey = $request->header('x-maker-key') ?? $request->header('x-app-key');

        if (!$makerKey) {
            return $this->error('Header x-maker-key atau x-app-key diperlukan', 400);
        }

        $maker = Maker::where('app_key', $makerKey)->first();

        if (!$maker) {
            return $this->error('App key tidak valid', 401);
        }

        // Inject maker_id ke request untuk digunakan di controller
        $request->merge(['maker_id' => $maker->id]);
        $request->attributes->set('maker', $maker);

        return $next($request);
    }
}
