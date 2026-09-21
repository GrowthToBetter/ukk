"use client";

/**
 * /test-api — Halaman diagnostik sementara.
 * Panggil GET /spaces dari api-client dan tampilkan hasilnya.
 * HAPUS halaman ini sebelum production.
 */

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { type ApiError, type Space, type SpacesListResponse } from "@/types/api";

interface TestState {
  status: "idle" | "loading" | "success" | "error";
  spaces: Space[];
  total: number;
  error: string | null;
  raw: string | null;
}

export default function TestApiPage() {
  const [state, setState] = useState<TestState>({
    status: "idle",
    spaces: [],
    total: 0,
    error: null,
    raw: null,
  });

  useEffect(() => {
    setState((s) => ({ ...s, status: "loading" }));

    apiClient
      .get<SpacesListResponse>("/spaces")
      .then((res) => {
        setState({
          status: "success",
          spaces: res.data.spaces,
          total: res.data.total,
          error: null,
          raw: JSON.stringify(res, null, 2),
        });
      })
      .catch((err: ApiError) => {
        setState((s) => ({
          ...s,
          status: "error",
          error: `[${err.statusCode}] ${err.message}`,
          raw: null,
        }));
      });
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-8 font-mono">
      <h1 className="mb-6 text-2xl font-bold">🧪 Test API — GET /spaces</h1>

      {/* ENV check */}
      <section className="mb-6 rounded border border-gray-300 bg-gray-100 p-4 text-sm">
        <p className="font-semibold">ENV Variables:</p>
        <p>
          NEXT_PUBLIC_API_BASE_URL:{" "}
          <span className="text-blue-700">
            {process.env.NEXT_PUBLIC_API_BASE_URL ?? "(tidak terbaca)"}
          </span>
        </p>
        <p>
          NEXT_PUBLIC_MAKER_KEY:{" "}
          <span className="text-blue-700">
            {process.env.NEXT_PUBLIC_MAKER_KEY
              ? process.env.NEXT_PUBLIC_MAKER_KEY.slice(0, 12) + "***"
              : "(tidak terbaca)"}
          </span>
        </p>
      </section>

      {/* Status */}
      <section className="mb-4">
        <span
          className={`inline-block rounded px-3 py-1 text-sm font-semibold ${
            state.status === "success"
              ? "bg-green-100 text-green-800"
              : state.status === "error"
                ? "bg-red-100 text-red-800"
                : state.status === "loading"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-600"
          }`}
        >
          {state.status.toUpperCase()}
        </span>
      </section>

      {state.status === "error" && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {state.status === "success" && (
        <>
          <section className="mb-4 rounded border border-green-300 bg-green-50 p-4 text-sm">
            <p>
              ✅ <strong>Berhasil</strong> — total space: {state.total}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-2 font-semibold">Space List (typed as Space[]):</h2>
            <ul className="space-y-2">
              {state.spaces.map((space) => (
                <li
                  key={space.id}
                  className="rounded border border-gray-200 bg-white p-3 text-sm shadow-sm"
                >
                  <p>
                    <strong>ID:</strong> {space.id} |{" "}
                    <strong>Nama:</strong> {space.nama_space} |{" "}
                    <strong>Tipe:</strong> {space.tipe} |{" "}
                    <strong>Harga/jam:</strong> Rp{space.harga_per_jam.toLocaleString("id-ID")}
                  </p>
                  <p className="text-gray-500">
                    Owner: {space.owner.nama_coworking} ({space.owner.nama_pemilik})
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Raw Response JSON:</h2>
            <pre className="overflow-auto rounded border border-gray-200 bg-gray-50 p-4 text-xs">
              {state.raw}
            </pre>
          </section>
        </>
      )}
    </main>
  );
}
