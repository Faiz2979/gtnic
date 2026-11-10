
"use client";

import bgSignup from "@/_assets/bg_signup.png";
import logoFinara1 from "@/_assets/logo_finara.png";
import logoFinara2 from "@/_assets/logo_finara2.png";
import { createClient } from "@/app/lib/supabase/client";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface InputFieldProps {
  label: string;
  icon: LucideIcon;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rightElement?: React.ReactNode;
  extraClass?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  rightElement,
  extraClass = "",
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-gray-700 font-semibold text-sm">
      {label}
    </label>

    <div className="flex items-center w-full border border-gray-300 rounded-lg bg-white focus-within:border-[#2d63ed] focus-within:ring-1 focus-within:ring-[#2d63ed] transition-all">
      <div className="pl-3 pr-2 text-gray-400 flex-shrink-0">
        <Icon size={18} strokeWidth={1.5} />
      </div>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={`flex-1 min-w-0 py-2.5 bg-transparent text-gray-900 outline-none text-sm placeholder-gray-400 ${extraClass}`}
      />

      {rightElement}
    </div>
  </div>
);

interface PasswordToggleProps {
  show: boolean;
  onToggle: () => void;
}

const PasswordToggle: React.FC<PasswordToggleProps> = ({
  show,
  onToggle,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
    className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none flex-shrink-0"
  >
    {show ? (
      <Eye size={20} strokeWidth={1.5} />
    ) : (
      <EyeOff size={20} strokeWidth={1.5} />
    )}
  </button>
);

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen font-sans bg-white text-gray-900">

      {/* Left Section */}
      <div className="hidden md:flex p-3 lg:p-4 min-h-screen w-full">
        <div className="relative flex flex-col justify-between p-6 lg:p-10 min-h-full w-full bg-[#f4f7ff] rounded-l overflow-hidden">

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
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0C2251] leading-tight">
              Kelola Bisnis Lebih Mudah <br />
              Bersama{" "}
              <span className="text-[#2d63ed]">Finara</span>
            </h2>

            <p className="text-gray-700 text-sm lg:text-base leading-relaxed mt-0.5">
              Satu tempat untuk mencatat transaksi,{" "}
              <br className="hidden sm:block" />
              memantau stok, dan mengelola keuangan usaha.
            </p>

            <div className="mt-2 bg-[#e5efff] text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-full w-max flex items-center gap-2">
              <span>Praktis</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>Aman</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>Terintegrasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative z-10 bg-white p-4 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="w-full max-w-sm flex flex-col items-center">

          <Image
            src={logoFinara1}
            alt="Logo Finara"
            width={240}
            height={56}
            className="h-20 w-auto object-contain mb-8"
          />

          <div className="text-center mb-5">
            <h1 className="text-2xl text-[#111827] font-bold mb-1.5">
              Selamat Datang di Finara
            </h1>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-3 w-full"
          >
            <InputField
              label="Email"
              icon={Mail}
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={setEmail}
              extraClass="font-semibold"
            />

            <InputField
              label="Password"
              icon={Lock}
              type={showPwd ? "text" : "password"}
              placeholder="Masukkan Password"
              value={password}
              onChange={setPassword}
              rightElement={
                <PasswordToggle
                  show={showPwd}
                  onToggle={() => setShowPwd((prev) => !prev)}
                />
              }
            />

            <div className="flex justify-end mt-[-4px]">
              <button
                type="button"
                className="text-xs font-semibold text-[#0C2251] hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2d63ed] hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg text-sm mt-2 transition-colors"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
            Dengan melanjutkan, Anda{" "}
            <span className="text-[#2d63ed] hover:underline cursor-pointer">
              menyetujui ketentuan
            </span>{" "}
            penggunaan Finara.
          </div>
        </div>
      </div>
    </div>
  );
}
