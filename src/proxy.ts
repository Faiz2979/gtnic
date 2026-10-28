// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // 1. Definisikan daftar path yang boleh diakses secara publik (Tanpa Login)
    // Route group seperti (public) tidak terbawa ke URL asli Next.js, jadi tulis path aslinya.
    const publicPaths = [
        "/",
        "/auth/login",
        "/auth/sign-up",
        "/auth/sign-up-success",
        "/auth/error",
        "/auth/callback",
        "/auth/confirm",
    ];

    // Cek apakah pathname saat ini termasuk public path
    const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));

    // 2. Special Handling: Jika user BELUM LOGIN dan mencoba akses halaman NON-PUBLIC
    if (!user && !isPublicPath) {
        const redirectUrl = new URL("/auth/login", request.url);
        // Opsional: Simpan URL asal agar bisa di-redirect kembali setelah login
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 3. Special Handling: Jika user SUDAH LOGIN tapi mencoba akses halaman auth (seperti /auth/login)
    if (user && (pathname === "/auth/login" || pathname === "/auth/sign-up")) {
        return NextResponse.redirect(new URL("/dashboard", request.url)); // Ganti /dashboard dengan halaman tujuan setelah login
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};