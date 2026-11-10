"use client";

import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/utils/enums/user-role.enum";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

dayjs.locale("id");

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export default function StaffManagementPage() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;
  const userName = profile?.fullName?.split(" ")[0] || "Owner";

  const {
    data: profiles = [],
    isLoading: isProfilesLoading,
    error: profilesError,
  } = trpc.user.listProfiles.useQuery(undefined, {
    enabled: isOwner,
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [directInviteLink, setDirectInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const inviteMutation = trpc.user.inviteEmployee.useMutation({
    onSuccess: (data) => {
      setInviteSuccessMsg(`Tautan undangan berhasil dibuat untuk ${inviteEmail}!`);
      if (data.inviteLink) {
        setDirectInviteLink(data.inviteLink);
      }
      setInviteEmail("");
      utils.user.listProfiles.invalidate();
    },
    onError: (err) => {
      setInviteError(err.message || "Gagal mengirim undangan staf.");
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccessMsg(null);
    setDirectInviteLink(null);
    setIsCopied(false);

    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Silakan masukkan alamat email yang valid.");
      return;
    }

    inviteMutation.mutate({ email: inviteEmail.trim().toLowerCase() });
  };

  const handleCopyLink = () => {
    if (!directInviteLink) return;
    navigator.clipboard.writeText(directInviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const resetInviteModal = () => {
    setInviteEmail("");
    setInviteSuccessMsg(null);
    setDirectInviteLink(null);
    setInviteError(null);
    setIsCopied(false);
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== "ALL" && p.role !== roleFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = p.fullName?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    });
  }, [profiles, roleFilter, searchQuery]);

  const totalStaffCount = profiles.filter((p) => p.role === ROLE.STAFF).length;
  const totalOwnerCount = profiles.filter((p) => p.role === ROLE.OWNER).length;
  const totalTransactionsRecorded = profiles.reduce(
    (acc, curr) => acc + (curr._count?.transactions || 0),
    0
  );

  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="text-sm font-medium text-[#64748B]">
          Memverifikasi hak akses...
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center px-4">
        <Card className="max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
          <CardContent className="p-0">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626]">
              <ShieldAlert className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-[#0F172A]">
              Akses Dibatasi
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Halaman <strong>Manajemen Staf</strong> hanya dapat diakses oleh pengguna
              dengan peran <strong>Owner</strong>.
            </p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button className="h-10 w-full rounded-xl bg-[#2563EB] font-medium text-white shadow-sm hover:bg-[#1D4ED8]">
                  Kembali ke Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ──────────────── TOP HEADER (IDENTIK DENGAN DASHBOARD, PRODUK & TRANSAKSI) ──────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Manajemen Staf
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#172554]/10 text-[#172554] border border-[#172554]/20">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Owner
            </span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]" suppressHydrationWarning>
            {todayFormatted} · {getGreeting()}, {userName}. Kelola daftar staf aktif dan undang karyawan baru ke sistem.
          </p>
        </div>

        {/* Action: Invite Staff Button */}
        <Button
          onClick={() => {
            resetInviteModal();
            setIsInviteOpen(true);
          }}
          className="h-10 gap-2 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4 stroke-[2.5]" />
          Invite Staff
        </Button>
      </div>

      {/* ──────────────── 3 METRIC SUMMARY CARDS (PERSIS DENGAN KARTU DASHBOARD) ──────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Total Staf Terdaftar */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Total staf aktif
              </span>
              <Users className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {totalStaffCount} Karyawan
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Memiliki hak akses operasional kasir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pengelola Utama (Owner) */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Pengelola utama (Owner)
              </span>
              <ShieldCheck className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {totalOwnerCount} Pengelola
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Akses penuh finansial, stok, dan staf
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Kontribusi Transaksi Tim */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Total kontribusi entri
              </span>
              <UserCheck className="h-4.5 w-4.5 text-[#16A34A]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {totalTransactionsRecorded} Transaksi
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Dicatat oleh seluruh anggota tim
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ──────────────── MAIN STAFF TABLE CARD ──────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardContent className="p-0">
          {/* Header Baris Dalam Kartu */}
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Daftar staf &amp; pengguna terdaftar
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Daftar seluruh karyawan yang memiliki akses ke sistem pembukuan.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dropdown Filter Role */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <option value="ALL">Semua Peran</option>
                <option value="STAFF">Staff Kasir</option>
                <option value="OWNER">Owner</option>
              </select>

              {/* Input Pencarian Minimalis */}
              <div className="relative w-full sm:w-60">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  size={15}
                  strokeWidth={1.8}
                />
                <Input
                  type="text"
                  placeholder="Cari nama atau email staf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border-[#E2E8F0] bg-white pl-9 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Konten Tabel Staf */}
          {isProfilesLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
              <p className="text-xs text-[#64748B]">Memuat data staf...</p>
            </div>
          ) : profilesError ? (
            <div className="py-10 text-center text-xs text-[#DC2626]">
              Gagal memuat data staf: {profilesError.message}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#94A3B8]">
                <Users className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                {searchQuery || roleFilter !== "ALL"
                  ? "Staf tidak ditemukan"
                  : "Belum ada staf terdaftar"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {searchQuery || roleFilter !== "ALL"
                  ? "Tidak ada staf yang sesuai dengan kriteria filter pencarian Anda."
                  : "Kirimkan undangan email kepada karyawan Anda untuk mulai berkolaborasi."}
              </p>
              {!searchQuery && roleFilter === "ALL" && (
                <Button
                  onClick={() => setIsInviteOpen(true)}
                  className="mt-4 h-9 gap-1.5 rounded-xl bg-[#2563EB] text-xs font-medium text-white hover:bg-[#1D4ED8]"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Invite Staff Sekarang
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3 px-3">Nama Lengkap &amp; Email</th>
                    <th className="py-3 px-3 text-center">Peran (Role)</th>
                    <th className="py-3 px-3">Tanggal Terdaftar</th>
                    <th className="py-3 px-3 text-center">Entri Transaksi</th>
                    <th className="py-3 px-3 text-right">Status Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filteredProfiles.map((p) => {
                    const isStaffRole = p.role === ROLE.STAFF;
                    const initialLetter = (p.fullName || p.email || "U")
                      .charAt(0)
                      .toUpperCase();
                    const txCount = p._count?.transactions || 0;

                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-[#F8FAFC]"
                      >
                        {/* Nama & Email */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                !isStaffRole
                                  ? "bg-[#172554] text-white"
                                  : "bg-[#2563EB] text-white"
                              }`}
                            >
                              {initialLetter}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-[#0F172A]">
                                {p.fullName || "Menunggu registrasi nama"}
                              </span>
                              <span className="text-[11px] text-[#94A3B8]">
                                {p.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Peran (Role) */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              !isStaffRole
                                ? "bg-[#172554]/10 text-[#172554] border border-[#172554]/20"
                                : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                            }`}
                          >
                            {!isStaffRole ? (
                              <>
                                <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                                Owner
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" strokeWidth={2} />
                                Staff
                              </>
                            )}
                          </span>
                        </td>

                        {/* Tanggal Terdaftar */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {dayjs(p.createdAt).format("DD MMMM YYYY")}
                          </div>
                        </td>

                        {/* Entri Transaksi */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#0F172A]">
                            {txCount} Transaksi
                          </span>
                        </td>

                        {/* Status Akun */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif &amp; Terverifikasi
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ──────────────── MODAL "INVITE STAFF" ──────────────── */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <form onSubmit={handleInviteSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#0F172A]">
                Undang Karyawan Baru
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                Kirimkan tautan undangan resmi untuk bergabung ke dalam sistem operasional.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {inviteError && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{inviteError}</p>
                </div>
              )}

              {inviteSuccessMsg && (
                <div className="rounded-xl bg-[#F0FDF4] p-3 text-xs text-[#166534] border border-[#BBF7D0] space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    {inviteSuccessMsg}
                  </div>
                  <p className="text-[11px] text-[#15803D]">
                    Email undangan telah dikirim. Karyawan dapat mengklik tautan dalam email untuk membuat kata sandi baru.
                  </p>

                  {/* Tombol Salin Tautan Langsung jika tersedia */}
                  {directInviteLink && (
                    <div className="pt-2 border-t border-[#BBF7D0]">
                      <p className="text-[11px] font-semibold text-[#166534] mb-1">
                        Atau salin tautan undangan langsung:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Input
                          readOnly
                          value={directInviteLink}
                          className="h-8 text-[10px] bg-white border-[#BBF7D0]"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCopyLink}
                          className="h-8 gap-1 bg-[#16A34A] text-[11px] text-white hover:bg-[#15803D]"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3" /> Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Salin
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Email Karyawan */}
              <div className="space-y-2">
                <Label htmlFor="staff-email" className="text-xs font-semibold text-[#0F172A]">
                  Email Karyawan <span className="text-[#DC2626]">*</span>
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    size={16}
                    strokeWidth={1.8}
                  />
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="nama.karyawan@perusahaan.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="h-10 rounded-xl border-[#E2E8F0] bg-white pl-9 text-sm text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Box Info Kebijakan Hak Akses */}
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 text-xs text-[#64748B] space-y-1">
                <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" /> Hak Akses Staf
                </p>
                <p className="text-[11px] leading-relaxed">
                  Staf yang diundang akan otomatis memiliki peran <strong>STAFF</strong>. Mereka dapat mencatat transaksi harian kasir tanpa dapat melihat data sensitif seperti harga modal (HPP) dan laba bersih perusahaan.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                className="h-10 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail}
                className="h-10 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8]"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Undangan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

