/**
 * src/lib/api-client.ts
 *
 * Fetch wrapper terpusat untuk semua komunikasi ke backend Laravel.
 *
 * Fitur:
 * - Auto-inject `x-maker-key` dari NEXT_PUBLIC_MAKER_KEY
 * - Auto-inject `Authorization: Bearer <token>` dari localStorage (key: "auth_token")
 * - Base URL dari NEXT_PUBLIC_API_BASE_URL
 * - Return typed ApiResponse<T> — throw ApiError kalau status false
 * - Handle 401 → clear token + redirect ke /login (hanya di browser)
 * - Helper: get, post, put, patch, del, uploadFile
 */

import { env } from "@/env.js";
import { ApiError, type ApiErrorResponse, type ApiResponse } from "@/types/api";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const MAKER_KEY = env.NEXT_PUBLIC_MAKER_KEY ?? "";
const TOKEN_STORAGE_KEY = "auth_token";

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function buildHeaders(extra?: HeadersInit, isFormData = false): Headers {
  const headers = new Headers(extra);

  if (MAKER_KEY) {
    headers.set("x-maker-key", MAKER_KEY);
  }

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Accept", "application/json");

  // Jangan set Content-Type untuk FormData, browser akan otomatis add boundary
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("auth_state");
  window.location.href = "/login";
}

/** Throw ApiError yang dibentuk dari shape error backend. */
function throwApiError(payload: ApiErrorResponse): never {
  throw new ApiError(payload);
}

/** Throw ApiError generic untuk network failure. */
function throwNetworkError(): never {
  throwApiError({
    status: false,
    statusCode: 0,
    message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    error: "Network Error",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Core fetch — parse response dan throw ApiError untuk status false.
 */
async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    params?: Record<string, string | number | undefined>;
    headers?: HeadersInit;
    skipAuth?: boolean;
  } = {},
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, options.params);
  
  const isFormData = options.body instanceof FormData;
  const headers = buildHeaders(options.headers, isFormData);

  if (options.skipAuth) {
    headers.delete("Authorization");
  }

  const init: RequestInit = { method, headers };

  if (options.body !== undefined) {
    if (isFormData) {
      init.body = options.body as BodyInit;
    } else {
      init.body = JSON.stringify(options.body);
    }
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throwNetworkError();
  }

  // `res` is always assigned here; TypeScript narrowing requires explicit annotation
  const json: unknown = await res.json();

  // 401 → clear auth + redirect
  if (res.status === 401) {
    handleUnauthorized();
    throwApiError(json as ApiErrorResponse);
  }

  // Narrow: status false → error shape
  if ((json as ApiErrorResponse).status === false) {
    throwApiError(json as ApiErrorResponse);
  }

  return json as ApiResponse<T>;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export const apiClient = {
  /**
   * GET /path dengan optional query params.
   * @example apiClient.get<SpacesListResponse>('/spaces', { tipe: 'desk' })
   */
  get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
    options: { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    return request<T>("GET", path, { params, ...options });
  },

  /** POST /path dengan JSON body. */
  post<T>(
    path: string,
    body?: unknown,
    options: { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, { body, ...options });
  },

  /** PUT /path dengan JSON body. */
  put<T>(
    path: string,
    body?: unknown,
    options: { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, { body, ...options });
  },

  /** PATCH /path dengan JSON body opsional. */
  patch<T>(
    path: string,
    body?: unknown,
    options: { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, { body, ...options });
  },

  /** DELETE /path. */
  del<T>(
    path: string,
    options: { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, options);
  },

  /**
   * Upload file (multipart/form-data).
   * TIDAK set Content-Type — browser isi sendiri dengan boundary.
   */
  async uploadFile<T>(
    path: string,
    file: File,
    field = "file",
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(field, file);

    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (MAKER_KEY) headers.set("x-maker-key", MAKER_KEY);
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      throwNetworkError();
    }

    const json: unknown = await res.json();

    if (res.status === 401) {
      handleUnauthorized();
      throwApiError(json as ApiErrorResponse);
    }

    if ((json as ApiErrorResponse).status === false) {
      throwApiError(json as ApiErrorResponse);
    }

    return json as ApiResponse<T>;
  },

  /** Simpan token ke localStorage. */
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  },

  /** Hapus token dari localStorage. */
  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
};
