// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
    const router = useRouter();
    const [loading, useLoading] = useState(Boolean);
    // useLoading(false);

    useEffect(() => {
        // Cek apakah URL dari email invite membawa hash access_token
        if (window.location.hash.includes("access_token")) {
            // Pindahkan user ke halaman update password beserta hash-nya
            useLoading(true);
            router.replace(`/auth/update-password${window.location.hash}`);
        }
        // useLoading(true);
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            {loading ? (
                <div className="flex flex-col items-center">
                    <svg
                        className="animate-spin h-8 w-8 text-blue-500 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p className="text-gray-700">Loading...</p>
                </div>
            ) : (
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
                    <p className="text-lg text-gray-600">This is the main content of the home page.</p>
                </div>
            )}  
        </div>
    );
}