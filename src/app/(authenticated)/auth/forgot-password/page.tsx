
"use client";

import bgSignup from "@/_assets/bg_signup.png";
import logoFinara1 from "@/_assets/logo_finara.png";
import logoFinara2 from "@/_assets/logo_finara2.png";
import { createClient } from "@/app/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ForgotPasswordFormProps {
  className?: string;
}

export default function ForgotPasswordForm({
  className,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        }
      );

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim email."
      );
    } finally {
      setIsLoading(false);
    }
  };

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

          {success ? (
            <>
              {/* Success State */}
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-5">
                <CheckCircle2
                  size={34}
                  className="text-success"
                  strokeWidth={1.8}
                />
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl text-foreground font-bold mb-2">
                  Periksa Email Anda
                </h1>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Instruksi untuk mengatur ulang password
                  telah dikirim ke email Anda.
                </p>
              </div>

              <div className="w-full bg-accent/10 border border-accent/20 p-4 rounded-lg flex items-center gap-3 mb-6">
                <Mail className="w-7 h-7 text-accent flex-shrink-0" />

                <div className="flex flex-col min-w-0">
                  <p className="text-accent font-semibold text-xs mb-0.5">
                    Email tujuan
                  </p>

                  <p className="text-foreground font-bold text-sm truncate">
                    {email}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-xs text-center leading-relaxed mb-6">
                Silakan periksa kotak masuk atau folder
                spam Anda. Ikuti tautan yang dikirimkan
                untuk membuat password baru.
              </p>

              <Button
                asChild
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 rounded-lg text-sm h-auto transition-colors"
              >
                <Link href="/auth/login">
                  <ArrowLeft size={17} className="mr-2" />
                  Kembali ke Login
                </Link>
              </Button>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl text-foreground font-bold mb-1.5">
                  Lupa Password?
                </h1>

                <p className="text-muted-foreground text-xs leading-relaxed">
                  Jangan khawatir! Masukkan email yang
                  terdaftar dan kami akan mengirimkan
                  tautan untuk mengatur ulang password Anda.
                </p>
              </div>

              {/* Forgot Password Form */}
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col gap-5 w-full"
              >
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="email"
                    className="text-foreground font-semibold text-sm"
                  >
                    Email
                  </Label>

                  <div className="flex items-center w-full border border-input rounded-lg bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
                    <div className="pl-3 pr-2 text-muted-foreground flex-shrink-0">
                      <Mail size={18} strokeWidth={1.5} />
                    </div>

                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email Anda"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Gunakan email yang terdaftar pada akun Finara.
                  </p>
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
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground font-semibold py-3 rounded-lg text-sm h-auto transition-colors"
                >
                  {isLoading
                    ? "Mengirim Email..."
                    : "Kirim Tautan Reset Password"}
                </Button>

                <div className="text-center text-sm">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors font-medium"
                  >
                    <ArrowLeft size={15} />
                    Kembali ke Login
                  </Link>
                </div>
              </form>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
            Dengan melanjutkan, Anda menyetujui ketentuan
            penggunaan Finara.
          </div>
        </div>
      </div>
    </div>
  );
}
