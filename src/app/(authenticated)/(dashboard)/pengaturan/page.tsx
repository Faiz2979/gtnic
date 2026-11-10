"use client";

import { createClient } from "@/app/lib/supabase/client";
import { trpc } from "@/client/trpc";
import { AccessDeniedCard } from "@/components/access-denied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/utils/enums/user-role.enum";
import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Server,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PengaturanPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const supabase = createClient();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;

  const [activeTab, setActiveTab] = useState<"profile" | "business" | "security" | "system">("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const [fullName, setFullName] = useState("");
  useEffect(() => {
    if (profile?.fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.getCurrentProfile.invalidate();
      showToast("Profil berhasil diperbarui");
    },
    onError: (err) => {
      alert(err.message || "Gagal memperbarui profil");
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfileMutation.mutate({ fullName: fullName.trim() });
  };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi berhasil diperbarui");
    } catch (err: unknown) {
      setPasswordError((err as Error).message || "Gagal mengubah kata sandi");
    } finally {
      setPasswordLoading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari sesi ini?")) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      setIsLoggingOut(false);
      alert("Gagal keluar dari sesi." + (error instanceof Error ? ` ${error.message}` : ""));
    }
  };

  const [businessName, setBusinessName] = useState("PT Nusantara Digital");
  const [businessAddress, setBusinessAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta Pusat");
  const [businessPhone, setBusinessPhone] = useState("0812-9876-5432");
  const [businessEmail, setBusinessEmail] = useState("admin@akufaiz.my.id");

  useEffect(() => {
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

    window.dispatchEvent(new Event("business_profile_updated"));
    showToast("Identitas usaha berhasil disimpan");
  };

  const tabs = [
    { id: "profile", label: "Profil Pengguna", icon: User },
    ...(isOwner ? [{ id: "business", label: "Identitas Usaha", icon: Building2 }] : []),
    { id: "security", label: "Keamanan Sandi", icon: Lock },
    ...(isOwner ? [{ id: "system", label: "Sistem & Notifikasi", icon: Bell }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl shadow-slate-950/20 border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pengaturan
            </h1>
            {isProfileLoading ? (
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
            ) : (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOwner 
                  ? "bg-slate-900 text-white" 
                  : "bg-blue-50 text-blue-700 border border-blue-200/60"
              }`}>
                {isOwner ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                {isOwner ? "Owner" : "Staff"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Kelola preferensi akun, identitas toko pada invoice, dan keamanan akses Anda.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-9 self-start sm:self-auto gap-2 rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Keluar Sesi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside className="md:col-span-3">
          <nav className="flex flex-col gap-1 p-1 rounded-2xl bg-slate-100/70 border border-slate-200/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="md:col-span-9">
          {activeTab === "profile" && (
            <Card className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-sm font-semibold text-slate-900">
                  Profil Pengguna
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi identitas akun Anda yang tercatat pada sistem.
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-base shrink-0">
                  {(profile?.fullName || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {profile?.fullName || "Memuat..."}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {profile?.email}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Nama Lengkap</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Nama ini akan tercatat sebagai staf pencatat di setiap transaksi kasir.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Alamat Email</Label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="h-10 rounded-xl border-slate-200/80 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">User ID</Label>
                  <Input
                    value={profile?.id || ""}
                    disabled
                    className="h-10 rounded-xl border-slate-200/80 text-xs font-mono bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all"
                  >
                    {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === "business" && (!isOwner ? (
            <AccessDeniedCard pageName="Identitas Usaha" />
          ) : (
            <Card className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-sm font-semibold text-slate-900">
                  Identitas Usaha & Toko
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi toko yang dicetak pada invoice, nota transaksi, dan laporan resmi.
                </p>
              </div>

              <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Nama Usaha / Toko</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Alamat Operasional</Label>
                  <Input
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">No. Telepon / WA</Label>
                    <Input
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs font-mono focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Email Resmi</Label>
                    <Input
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all"
                  >
                    Simpan Identitas Usaha
                  </Button>
                </div>
              </form>
            </Card>
          ))}

          {activeTab === "security" && (
            <Card className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-sm font-semibold text-slate-900">
                  Keamanan Sandi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbarui kata sandi akun untuk melindungi akses data kas dan keuangan.
                </p>
              </div>

              {passwordError && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Konfirmasi Kata Sandi</Label>
                  <Input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-slate-50/40 text-xs focus:bg-white"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all"
                  >
                    {passwordLoading ? "Memperbarui..." : "Perbarui Kata Sandi"}
                  </Button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="rounded-xl border border-red-200/70 bg-red-50/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Keluar dari Sesi Kerja</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Akhiri sesi login di browser ini untuk keamanan akun Anda.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-8 rounded-lg border-red-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 shrink-0"
                  >
                    Keluar Akun
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "system" && (!isOwner ? (
            <AccessDeniedCard pageName="Sistem & Notifikasi" />
          ) : (
            <Card className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Integrasi Sistem & Notifikasi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status koneksi modul otomatisasi pengiriman berkas dan pemantauan stok.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900">
                      Layanan Email SMTP / Resend API
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Digunakan untuk otomatisasi pengiriman laporan berkas PDF resmi ke email Owner saat Closing Bulanan.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">
                      Peringatan Stok Rendah
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    &lt; 10 unit
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Memberikan tanda visual pada halaman Produk bila sisa stok fisik mendekati habis.
                </p>
              </div>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
}
