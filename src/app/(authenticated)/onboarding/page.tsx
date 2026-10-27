// src/app/onboarding/page.tsx
"use client";

import { createClient } from "@/app/lib/supabase/client";
import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [userData, setUserData] = useState<{ id: string; email: string } | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const utils = trpc.useUtils();
    const onboardingMutation = trpc.user.createProfile.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            router.push("/dashboard");
        },
    });

    // Ambil id dan email dari session Supabase yang aktif saat ini
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user || !user.email) {
                router.push("/auth/update-password"); // Lempar balik jika sesi tidak ada
                return;
            }

            setUserData({
                id: user.id,
                email: user.email,
            });
            setLoadingSession(false);
        };

        fetchUser();
    }, [supabase, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        // Kirim data sesuai dengan struktur IRegisterUser
        onboardingMutation.mutate({
            id: userData.id,
            email: userData.email,
            fullName,
            // Jika backend Anda menerima tambahan field seperti phone, bisa disertakan di sini
        });
    };

    if (loadingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-gray-500">Memuat data sesi...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lengkapi Profil Anda</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Selamat datang! Mohon isi nama lengkap Anda untuk menyelesaikan proses pendaftaran.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Menampilkan email (readonly) sebagai info akun */}
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={userData?.email || ""}
                            disabled
                            className="bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Contoh: Budi Santoso"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    {onboardingMutation.error && (
                        <p className="text-sm text-red-500">{onboardingMutation.error.message}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={onboardingMutation.isPending}
                    >
                        {onboardingMutation.isPending ? "Menyimpan..." : "Simpan & Masuk ke Aplikasi"}
                    </Button>
                </form>
            </div>
        </div>
    );
}