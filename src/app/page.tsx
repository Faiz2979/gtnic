
"use client";

import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (window.location.hash.includes("access_token")) {
        router.replace(
          `/auth/update-password${window.location.hash}`
        );
        return;
      }

      const supabase = createClient();

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check authentication:", error);
      }
    };

    checkAuth();
  }, [router]);

  return <></>;
}
