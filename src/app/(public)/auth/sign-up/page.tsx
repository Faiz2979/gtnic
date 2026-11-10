"use client";

import bgSignup from "@/_assets/bg_signup.png";
import logoFinara1 from "@/_assets/logo_finara.png";
import logoFinara2 from "@/_assets/logo_finara2.png";
import { Eye, EyeOff, Lock, LucideIcon, Mail, User } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface InputFieldProps {
  label: string;
  icon: LucideIcon;
  type: string;
  placeholder: string;
  rightElement?: React.ReactNode;
  extraClass?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, type, placeholder, rightElement, extraClass = "" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-gray-700 font-semibold text-sm">{label}</label>
    <div className="flex items-center w-full border border-gray-300 rounded-lg bg-white focus-within:border-[#2d63ed] focus-within:ring-1 focus-within:ring-[#2d63ed] transition-all">
      <div className="pl-3 pr-2 text-gray-400 flex-shrink-0">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
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

const PasswordToggle: React.FC<PasswordToggleProps> = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none flex-shrink-0"
  >
    {show ? (
      <Eye className="pointer-events-none" size={20} strokeWidth={1.5} />
    ) : (
      <EyeOff className="pointer-events-none" size={20} strokeWidth={1.5} />
    )}
  </button>
);

export default function Page() {
  const [activeTab, setActiveTab] = useState("masuk");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Form disubmit pada tab: ${activeTab}`);
  };

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen font-sans bg-white text-gray-900">

        <div className="hidden md:flex p-3 lg:p-4 h-full w-full">
          <div className="relative flex flex-col justify-between p-6 lg:p-10 h-full w-full bg-[#f4f7ff] rounded-l overflow-hidden">
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
                Kelola Bisnis Lebih Mudah <br /> Bersama <span className="text-[#2d63ed]">Finara</span>
              </h2>
              <p className="text-gray-700 text-sm lg:text-base leading-relaxed mt-0.5">
                Satu tempat untuk mencatat transaksi, <br className="hidden sm:block" /> memantau stok, dan mengelola keuangan usaha.
              </p>
              <div className="mt-2 bg-[#e5efff] text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-full w-max flex items-center gap-2">
                <span>Praktis</span><span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>Aman</span><span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>Terintegrasi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white p-4 flex flex-col items-center justify-center w-full h-full">
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
                {activeTab === "masuk" ? "Selamat Datang di Finara" : "Daftar Akun Baru"}
              </h1>
              <p className="text-gray-600 text-xs">
                {activeTab === "masuk"
                  ? "Anda diundang untuk bergabung sebagai Staff"
                  : "Lengkapi data diri Anda untuk mengaktifkan akses Smart Ledger"}
              </p>
            </div>

            {activeTab === "masuk" && (
              <div className="w-full bg-[#E7F0FF] p-3.5 rounded-lg flex items-center justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  <Mail className="w-7 h-7 text-black flex-shrink-0" />
                  <div className="flex flex-col">
                    <h3 className="text-[#2367E2] font-semibold text-xs mb-0.5">Undangan untuk anda</h3>
                    <p className="text-gray-900 font-bold text-sm">parkiran@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-[1.5px] h-8 bg-[#2367E2]"></div>
                  <div className="bg-[#D1E2FC] text-[#2367E2] font-bold text-xs px-4 py-1.5 rounded-full">
                    <button type="button" className="w-full h-full">Staff</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full mb-5 border border-gray-300 rounded-lg p-0.5">
              {["masuk", "daftar"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 capitalize font-semibold text-sm rounded-md transition-all ${activeTab === tab
                    ? "bg-[#2d63ed] text-white shadow-sm"
                    : "text-[#2d63ed] hover:bg-blue-50"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
              {activeTab === "daftar" && (
                <InputField label="Nama Lengkap" icon={User} type="text" placeholder="Masukkan Nama Lengkap" />
              )}

              <InputField
                label="Email" icon={Mail} type="email" placeholder="parkiran@gmail.com"
                extraClass="font-semibold underline decoration-gray-400 underline-offset-4"
              />

              <InputField
                label="Password" icon={Lock} type={showPwd ? "text" : "password"} placeholder="Masukkan Password"
                rightElement={<PasswordToggle show={showPwd} onToggle={() => setShowPwd(!showPwd)} />}
              />

              {activeTab === "daftar" && (
                <InputField
                  label="Konfirmasi Password" icon={Lock} type={showConfirm ? "text" : "password"} placeholder="Ulangi Password"
                  rightElement={<PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />}
                />
              )}

              {activeTab === "masuk" && (
                <div className="flex justify-end mt-[-4px]">
                  <button type="button" className="text-xs font-semibold text-[#0C2251] hover:underline">Lupa Password?</button>
                </div>
              )}

              <button type="submit" className="w-full bg-[#2d63ed] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm mt-2 transition-opacity">
                {activeTab === "masuk" ? "Masuk dan terima undangan" : "Daftar Akun Baru & Verifikasi"}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
              Dengan melanjutkan, Anda <span className="text-[#2d63ed] hover:underline cursor-pointer">menyetujui ketentuan</span> penggunaan Finara.
            </div>
          </div>
        </div>
      </div>
  );
}
