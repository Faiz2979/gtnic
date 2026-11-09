// src/app/_components/AuthGuard.tsx
"use client";

import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
        return <>{children}</>;
    }
    
    const isAuthPage = pathname.startsWith("/auth") || pathname === "/";

    const { data: profile, isLoading, isFetched, error } = trpc.user.getCurrentProfile.useQuery(undefined, {
        enabled: !isAuthPage,
        retry: false,
    });

    // --- CETAK STATUS DI SINI AGAR KELIATAN DI CONSOLE ---
    console.log("AuthGuard Status -> pathname:", pathname, "isLoading:", isLoading, "isFetched:", isFetched, "profile:", profile, "error:", error);

    useEffect(() => {
        if (isAuthPage || isLoading || !isFetched) return;

        const isOnboarded = Boolean(profile && profile.fullName);

        if (!isOnboarded && pathname !== "/onboarding") {
            router.push("/onboarding");
            return;
        }

        if (isOnboarded && pathname === "/onboarding") {
            router.push("/dashboard");
            return;
        }

        if (pathname.startsWith("/owner/dashboard") && profile?.role !== ROLE.OWNER) {
            router.push("/dashboard");
            return;
        }
    }, [profile, isLoading, isFetched, pathname, router, isAuthPage]);

    if (!isAuthPage && (isLoading || !isFetched)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-gray-500">Memuat sesi pengguna...</p>
            </div>
        );
    }

    return <>{children}</>;
}