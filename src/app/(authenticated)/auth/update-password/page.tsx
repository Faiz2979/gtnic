// src/app/auth/update-password/page.tsx
"use client";

import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState } from "react";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const handleTokenExchange = async () => {
            // 1. Ambil hash dari URL (contoh: #access_token=xyz&refresh_token=abc&type=invite)
            const hash = window.location.hash;
            
            if (hash && hash.includes("access_token")) {
                const params = new URLSearchParams(hash.substring(1)); // buang tanda pagar '#'
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");

                if (accessToken && refreshToken) {
                    // 2. Paksa set session menggunakan token dari email
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (sessionError) {
                        setError("Token undangan tidak valid atau kedaluwarsa.");
                    } else {
                        setIsReady(true); // Sesi berhasil dipasang, form boleh dibuka
                    }
                    return;
                }
            }

            // 3. Kalau tidak ada di hash, cek apakah sudah ada sesi aktif sebelumnya
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsReady(true);
            } else {
                setError("Tidak ada token undangan yang ditemukan. Silakan klik ulang link di email Anda.");
            }
        };

        handleTokenExchange();
    }, [supabase]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            // Berhasil! Bersihkan URL hash lalu lanjut ke onboarding
            window.location.href = "/onboarding";
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Gagal memperbarui password");
            setIsLoading(false);
        }
    };

    if (!isReady && !error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-gray-500">Memproses token undangan...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <form onSubmit={handleUpdatePassword} className="w-full max-w-md space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <h1 className="text-xl font-bold">Buat Password Anda</h1>
                <p className="text-sm text-gray-500">Silakan masukkan password baru untuk mengamankan akun Anda.</p>

                <div>
                    <label className="block text-sm font-medium">Password Baru</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1 w-full rounded border p-2"
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? "Menyimpan..." : "Simpan Password & Lanjutkan"}
                </button>
            </form>
        </div>
    );
}