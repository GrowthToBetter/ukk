"use client";

/**
 * src/lib/auth-context.tsx
 *
 * React Context untuk state autentikasi.
 * Persist ke localStorage. Expose useAuth() hook di seluruh app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiClient } from "@/lib/api-client";
import {
  type LoginAdminResponse,
  type LoginDto,
  type LoginMemberResponse,
  type LoginResponse,
  type Member,
  type Role,
  type SpaceOwner,
  type User,
} from "@/types/api";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  member: Member | null;
  spaceOwner: SpaceOwner | null;
}

export interface AuthContextValue extends AuthState {
  /** true saat hydrating dari localStorage (SSR → client mount). */
  isLoading: boolean;
  /** true kalau sudah login (token ada). */
  isAuthenticated: boolean;
  /** Login via /auth/login. Throw ApiError kalau gagal. */
  login: (credentials: LoginDto) => Promise<void>;
  /**
   * Langsung simpan state dari response register (yang sudah include access_token).
   * Dipakai di halaman register untuk auto-login tanpa call /auth/login lagi.
   */
  loginFromResponse: (data: LoginResponse) => void;
  /** Hapus semua state + token, redirect ke /login. */
  logout: () => void;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── STORAGE ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "auth_state";

function saveToStorage(state: AuthState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromStorage(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

const EMPTY_STATE: AuthState = {
  token: null,
  user: null,
  role: null,
  member: null,
  spaceOwner: null,
};

// ─── NARROW HELPERS ──────────────────────────────────────────────────────────

const isMemberLogin = (r: LoginResponse): r is LoginMemberResponse =>
  r.user.role === "member";

const isAdminLogin = (r: LoginResponse): r is LoginAdminResponse =>
  r.user.role === "admin_space";

function buildStateFromResponse(data: LoginResponse): AuthState {
  return {
    token: data.access_token,
    user: data.user,
    role: data.user.role,
    member: isMemberLogin(data) ? data.member : null,
    spaceOwner: isAdminLogin(data) ? data.space_owner : null,
  };
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate dari localStorage pada mount client
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved?.token) {
      setState(saved);
      apiClient.setToken(saved.token);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginDto): Promise<void> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", credentials);
    const newState = buildStateFromResponse(res.data);
    apiClient.setToken(newState.token!);
    saveToStorage(newState);
    setState(newState);
  }, []);

  const loginFromResponse = useCallback((data: LoginResponse): void => {
    const newState = buildStateFromResponse(data);
    apiClient.setToken(newState.token!);
    saveToStorage(newState);
    setState(newState);
  }, []);

  const logout = useCallback((): void => {
    apiClient.clearToken();
    clearStorage();
    setState(EMPTY_STATE);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    isLoading,
    isAuthenticated: !!state.token,
    login,
    loginFromResponse,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
