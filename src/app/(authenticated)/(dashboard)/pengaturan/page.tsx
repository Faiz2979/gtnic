"use client";

import { createClient } from "@/app/lib/supabase/client";
import { trpc } from "@/client/trpc";
import { AccessDeniedCard } from "@/components/access-denied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/utils/enums/user-role.enum";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

dayjs.locale("id");

// Salam waktu
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export default function PengaturanPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const supabase = createClient();

  // 1. Data Profil Pengguna Aktif
  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;
  const userName = profile?.fullName?.split(" ")[0] || "Pengguna";

  // 2. State Tab Navigasi Pengaturan
  const [activeTab, setActiveTab] = useState<"profile" | "business" | "security" | "system">("profile");

  // 3. State Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // 4. Form Profil
  const [fullName, setFullName] = useState("");
  useEffect(() => {
    if (profile?.fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.getCurrentProfile.invalidate();
      showToast("Nama profil berhasil diperbarui!");
    },
    onError: (err) => {
      alert(err.message || "Gagal memperbarui profil.");
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Nama lengkap tidak boleh kosong.");
      return;
    }
    updateProfileMutation.mutate({ fullName: fullName.trim() });
  };

  // 5. Form Ubah Kata Sandi
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi berhasil diubah! Gunakan sandi baru untuk login berikutnya.");
    } catch (err: unknown) {
      setPasswordError((err as Error).message || "Gagal mengubah kata sandi.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // 6. Handle Logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun ini?")) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      setIsLoggingOut(false);
      alert("Gagal keluar dari sesi."+(error instanceof Error ? ` ${error.message}` : ""));
    }
  };

  // 7. Form Profil Usaha (LocalStorage & Reactive Synchronization)
  const [businessName, setBusinessName] = useState("PT Nusantara Digital");
  const [businessAddress, setBusinessAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta Pusat");
  const [businessPhone, setBusinessPhone] = useState("0812-9876-5432");
  const [businessEmail, setBusinessEmail] = useState("admin@akufaiz.my.id");

  useEffect(() => {
    // Ambil profil usaha tersimpan dari browser storage
    const savedName = localStorage.getItem("finara_business_name");
    const savedAddress = localStorage.getItem("finara_business_address");
    const savedPhone = localStorage.getItem("finara_business_phone");
    const savedEmail = localStorage.getItem("finara_business_email");

    if (savedName) setBusinessName(savedName);
    if (savedAddress) setBusinessAddress(savedAddress);
    if (savedPhone) setBusinessPhone(savedPhone);
    if (savedEmail) setBusinessEmail(savedEmail);
  }, []);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("finara_business_name", businessName);
    localStorage.setItem("finara_business_address", businessAddress);
    localStorage.setItem("finara_business_phone", businessPhone);
    localStorage.setItem("finara_business_email", businessEmail);

    // Kirim sinyal broadcast agar Sidebar langsung berubah detik itu juga
    window.dispatchEvent(new Event("business_profile_updated"));

    showToast("Identitas usaha berhasil disimpan & disinkronkan ke sidebar!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#172554] px-4 py-3 text-sm font-medium text-white shadow-xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Finara Design */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <span>{dayjs().format("dddd, D MMMM YYYY")}</span>
            <span>•</span>
            <span>{getGreeting()}, {userName}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Pengaturan Sistem & Akun
            </h1>
            {isProfileLoading ? (
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
            ) : isOwner ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#172554]/20 bg-[#172554]/10 px-3 py-1 text-xs font-semibold text-[#172554] shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} /> Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                <UserCheck className="h-3.5 w-3.5" strokeWidth={2} /> Staff
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#64748B]">
            Kelola profil pengguna, identitas usaha, keamanan akses, dan preferensi notifikasi sistem Anda.
          </p>
        </div>

        {/* Tombol Logout Cepat */}
        <div>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-medium shadow-sm h-10 px-4"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-1.5 h-4 w-4" />
            )}
            Keluar Akun (Logout)
          </Button>
        </div>
      </div>

      {/* Settings Layout with Vertical Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "profile"
                ? "bg-[#172554] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profil Pengguna</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "business"
                  ? "bg-[#172554] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Identitas Usaha / Toko</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "security"
                ? "bg-[#172554] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Keamanan & Password</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab("system")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "system"
                  ? "bg-[#172554] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Sistem & Notifikasi</span>
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="md:col-span-3">
          {/* Tab 1: Profil Pengguna */}
          {activeTab === "profile" && (
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#2563EB]" />
                  Informasi Profil Pribadi
                </h2>
                <p className="text-xs text-slate-500">
                  Perbarui nama lengkap dan tinjau hak akses akun Anda pada sistem.
                </p>
              </div>

              {/* Avatar & Role Badge Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#172554] text-white font-bold text-lg shadow-sm">
                  {(profile?.fullName || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    {profile?.fullName || "Memuat..."}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isOwner
                          ? "bg-[#172554]/10 text-[#172554] border border-[#172554]/20"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {profile?.role || "STAFF"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{profile?.email}</div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Nama Lengkap</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama ini akan tercantum sebagai staf pencatat transaksi pada buku besar.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Alamat Email (Akun)</Label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="mt-1.5 rounded-xl border-slate-200 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email terikat dengan otentikasi login Supabase.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">ID Pengguna (User ID)</Label>
                  <Input
                    value={profile?.id || ""}
                    disabled
                    className="mt-1.5 rounded-xl border-slate-200 text-xs font-mono bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium h-10 px-5"
                  >
                    {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tab 2: Informasi Usaha */}
          {activeTab === "business" && (!isOwner ? (
            <AccessDeniedCard pageName="Identitas Usaha / Toko" />
          ) : (
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#2563EB]" />
                  Identitas Usaha & Toko
                </h2>
                <p className="text-xs text-slate-500">
                  Informasi resmi toko yang tercetak pada invoice, laporan PDF, dan komunikasi pelanggan.
                </p>
              </div>

              <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-lg">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Nama Usaha / Merek Dagang</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Alamat Toko / Kantor Operasional</Label>
                  <Input
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">No. Telepon / WhatsApp CS</Label>
                    <Input
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="mt-1.5 rounded-xl border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Email Resmi Usaha</Label>
                    <Input
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">Format Mata Uang & Angka</div>
                  <div>Mata Uang Default: <strong>IDR (Rupiah Indonesia)</strong></div>
                  <div>Pemisah Ribuan: Titik (Contoh: Rp 25.000)</div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium h-10 px-5"
                  >
                    Simpan Data Usaha
                  </Button>
                </div>
              </form>
            </Card>
          ))}

          {/* Tab 3: Keamanan & Kata Sandi */}
          {activeTab === "security" && (
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#2563EB]" />
                  Keamanan Akun & Kata Sandi
                </h2>
                <p className="text-xs text-slate-500">
                  Perbarui kata sandi akun Anda untuk menjaga keamanan data finansial usaha.
                </p>
              </div>

              {passwordError && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium h-10 px-5"
                  >
                    {passwordLoading ? "Memperbarui..." : "Perbarui Kata Sandi"}
                  </Button>
                </div>
              </form>

              {/* Status Sesi Login Aktif */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Sesi Login Aktif</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Perangkat ini terotentikasi secara aman melalui Supabase Auth. Untuk mengakhiri sesi dan keluar dari sistem, silakan gunakan tombol <strong>Keluar Akun (Logout)</strong> di sudut kanan atas halaman.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tab 4: Sistem & Notifikasi */}
          {activeTab === "system" && (!isOwner ? (
            <AccessDeniedCard pageName="Sistem & Notifikasi" />
          ) : (
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#2563EB]" />
                  Integrasi Sistem & Notifikasi
                </h2>
                <p className="text-xs text-slate-500">
                  Status koneksi layanan otomatisasi email rekapitulasi closing dan peringatan stok.
                </p>
              </div>

              {/* Status Layanan Email SMTP */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Layanan Email SMTP / Resend API
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Pengirim: Smart Ledger &lt;no-reply@woylah.akufaiz.my.id&gt;
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Terverifikasi &amp; Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Digunakan untuk otomatisasi pengiriman berkas rekapitulasi bulanan resmi ke email Owner saat eksekusi Closing Bulanan selesai.
                </p>
              </div>

              {/* Status Peringatan Stok Rendah */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Peringatan Stok Rendah (Low Stock Alert)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ambang batas: &lt; 10 unit fisik
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Memberikan tanda peringatan visual kuning/merah pada halaman Produk jika sisa stok fisik mendekati habis agar tidak terjadi out-of-stock di kasir.
                </p>
              </div>

              {/* Lingkungan Sistem */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white text-xs text-slate-600 space-y-2">
                <div className="font-semibold text-slate-800">Informasi Teknis Sistem</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>Platform: Next.js 16 (Turbopack)</div>
                  <div>Database: Supabase PostgreSQL (Pooler)</div>
                  <div>API Protocol: tRPC v11 Type-Safe</div>
                  <div>Design System: Finara SaaS Standard</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

