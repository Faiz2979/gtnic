"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Cek apakah URL dari email invite membawa hash access_token
        if (window.location.hash.includes("access_token")) {
            // Pindahkan user ke halaman update password beserta hash-nya
            router.replace(`/auth/update-password${window.location.hash}`);
        }
        // useLoading(true);
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
                <p className="text-lg text-gray-600">This is the main content of the home page.</p>
            </div>
        </div>
    );
}