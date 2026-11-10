
"use client";

import bgSignup from "@/_assets/bg_signup.png";
import logoFinara1 from "@/_assets/logo_finara.png";
import logoFinara2 from "@/_assets/logo_finara2.png";
import { createClient } from "@/app/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface UpdatePasswordFormProps {
  email?: string;
  className?: string;
}

type AuthFlow = "invitation" | "recovery";

export default function UpdatePasswordForm({
  email: initialEmail,
  className,
}: UpdatePasswordFormProps) {
  const router = useRouter();
  const hasVerified = useRef(false);

  const [email, setEmail] = useState(initialEmail ?? "");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("invitation");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyAuth = async () => {
      try {
        const supabase = createClient();

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        let user = null;

        // 1. PKCE Flow: Forgot Password
        if (code) {
          setAuthFlow("recovery");

          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          user = data.user;
        }
        // 2. Implicit Flow: Invitation
        else {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (!accessToken || !refreshToken) {
            throw new Error(
              "Link verifikasi tidak valid atau sudah kedaluwarsa."
            );
          }

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          user = data.user;
        }

        if (!user) {
          throw new Error("Session pengguna tidak ditemukan.");
        }

        setEmail(user.email ?? "");

        // Bersihkan code/token dari URL setelah berhasil diverifikasi
        url.searchParams.delete("code");

        window.history.replaceState(
          null,
          "",
          url.pathname +
            (url.searchParams.toString()
              ? `?${url.searchParams.toString()}`
              : "")
        );
      } catch (err: unknown) {
        console.error("Authentication verification failed:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Gagal memverifikasi link."
        );
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, []);

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isRecovery = authFlow === "recovery";

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Memverifikasi link...
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 min-h-screen font-sans bg-background text-foreground ${className ?? ""}`}
    >
      {/* Left Section */}
      <div className="hidden md:flex p-3 lg:p-4 min-h-screen w-full">
        <div className="relative flex flex-col justify-between p-6 lg:p-10 min-h-full w-full bg-muted rounded-lg overflow-hidden">
          <Image
            src={bgSignup}
            alt="Background Finara"
            fill
            priority
            className="object-cover mix-blend-multiply pointer-events-none opacity-50"
          />

          <div className="relative z-10">
            <Image
              src={logoFinara2}
              alt="Logo Finara"
              width={160}
              height={40}
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="relative z-10 flex flex-col gap-3 max-w-lg mb-2 mt-auto">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-primary leading-tight">
              Kelola Bisnis Lebih Mudah <br />
              Bersama{" "}
              <span className="text-accent">Finara</span>
            </h2>

            <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mt-0.5">
              Satu tempat untuk mencatat transaksi,{" "}
              <br className="hidden sm:block" />
              memantau stok, dan mengelola keuangan usaha.
            </p>

            <div className="mt-2 bg-accent/10 text-foreground text-xs font-semibold px-4 py-2.5 rounded-full w-max flex items-center gap-2">
              <span>Praktis</span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Aman</span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Terintegrasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative z-10 bg-background p-4 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="w-full max-w-sm flex flex-col items-center">
          <Image
            src={logoFinara1}
            alt="Logo Finara"
            width={240}
            height={56}
            className="h-20 w-auto object-contain mb-8"
          />

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl text-foreground font-bold mb-1.5">
              {isRecovery ? "Atur Ulang Password" : "Buat Password Baru"}
            </h1>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {isRecovery
                ? "Buat password baru untuk mengamankan kembali akun Finara Anda."
                : "Buat password untuk mengaktifkan akun Staff Anda di Finara."}
            </p>
          </div>

          {/* Account Information */}
          <div className="w-full bg-accent/10 border border-accent/20 p-3.5 rounded-lg flex items-center justify-between mb-6">
            <div className="flex items-center gap-3.5 min-w-0">
              <Mail className="w-7 h-7 text-accent flex-shrink-0" />

              <div className="flex flex-col min-w-0">
                <h3 className="text-accent font-semibold text-xs mb-0.5">
                  {isRecovery
                    ? "Permintaan Reset Password"
                    : "Undangan untuk Anda"}
                </h3>

                <p className="text-foreground font-bold text-sm truncate">
                  {email || "Email pengguna"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-[1.5px] h-8 bg-accent/40" />

              <div className="bg-accent/15 text-accent font-bold text-xs px-4 py-1.5 rounded-full">
                {isRecovery ? "Recovery" : "Staff"}
              </div>
            </div>
          </div>

          {/* Password Form */}
          <form
            onSubmit={handleUpdatePassword}
            className="flex flex-col gap-4 w-full"
          >
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-foreground font-semibold text-sm"
              >
                Password Baru
              </Label>

              <div className="flex items-center w-full border border-input rounded-lg bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
                <div className="pl-3 pr-2 text-muted-foreground flex-shrink-0">
                  <Lock size={18} strokeWidth={1.5} />
                </div>

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="px-3 py-2 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {showPassword ? (
                    <Eye size={20} strokeWidth={1.5} />
                  ) : (
                    <EyeOff size={20} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Gunakan minimal 8 karakter.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-foreground font-semibold text-sm"
              >
                Konfirmasi Password
              </Label>

              <div className="flex items-center w-full border border-input rounded-lg bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
                <div className="pl-3 pr-2 text-muted-foreground flex-shrink-0">
                  <Lock size={18} strokeWidth={1.5} />
                </div>

                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="px-3 py-2 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {showConfirmPassword ? (
                    <Eye size={20} strokeWidth={1.5} />
                  ) : (
                    <EyeOff size={20} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || isVerifying || !!error}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground font-semibold py-3 rounded-lg text-sm mt-1 h-auto transition-colors"
            >
              {isLoading
                ? "Menyimpan Password..."
                : isRecovery
                  ? "Simpan Password Baru"
                  : "Simpan Password & Aktifkan Akun"}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            Dengan melanjutkan, Anda menyetujui ketentuan
            penggunaan Finara.
          </div>
        </div>
      </div>
    </div>
  );
}
