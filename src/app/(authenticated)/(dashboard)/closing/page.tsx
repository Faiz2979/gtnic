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
import { AccessDeniedCard } from "@/components/access-denied";
import { ROLE } from "@/utils/enums/user-role.enum";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  AlertTriangle,
  Archive,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Unlock
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

dayjs.locale("id");

// Format Rupiah helper
const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

// Salam waktu
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

interface ClosingRecordItem {
  id?: string;
  period?: string;
  totalRevenue: number;
  totalCapital: number;
  netProfit: number;
  status: string;
  closedAt?: string | null;
  itemsSnapshot: Array<{ productName?: string; physicalStock?: number; systemStock?: number }>;
  closedBy?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface itemSnapshot {
  productName?: string;
  physicalStock?: number;
  systemStock?: number;
}

export default function ClosingPage() {
  const utils = trpc.useUtils();

  // 1. Profil Pengguna & Proteksi Role Owner
  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;
  const userName = profile?.fullName?.split(" ")[0] || "Owner";

  // 2. Periode Saat Ini
  const currentPeriod = dayjs().format("YYYY-MM");
  const [selectedClosingPeriod, setSelectedClosingPeriod] = useState<string>(currentPeriod);

  // 3. Query Arsip Riwayat Closing
  const {
    data: closings = [],
    isLoading: isClosingsLoading,
    error: closingsError,
  } = trpc.closing.getAllClosings.useQuery(undefined, {
    enabled: isOwner,
  });

  // 4. Query Preview Kalkulasi Closing untuk Periode Terpilih
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = trpc.closing.getPreview.useQuery(
    { period: selectedClosingPeriod },
    { enabled: isOwner }
  );

  // State Modal Eksekusi Closing
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [executeSuccessMsg, setExecuteSuccessMsg] = useState<string | null>(null);
  const [executeErrorMsg, setExecuteErrorMsg] = useState<string | null>(null);

  // State Modal Detail Arsip
  const [selectedArchiveDetail, setSelectedArchiveDetail] = useState<ClosingRecordItem | null>(null);
  const [isArchiveDetailOpen, setIsArchiveDetailOpen] = useState(false);

  // Mutation Eksekusi Penutupan Buku
  const executeMutation = trpc.closing.execute.useMutation({
    onSuccess: (res) => {
      setExecuteSuccessMsg(res.message);
      setConfirmText("");
      utils.closing.getAllClosings.invalidate();
      utils.closing.getPreview.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
      utils.product.getAllProducts.invalidate();
    },
    onError: (err) => {
      setExecuteErrorMsg(err.message || "Gagal mengeksekusi penutupan buku.");
    },
  });

  // Mutation Membuka Kembali Periode Closing (Reopen)
  const reopenMutation = trpc.closing.reopen.useMutation({
    onSuccess: () => {
      utils.closing.getAllClosings.invalidate();
      utils.closing.getPreview.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
      utils.product.getAllProducts.invalidate();
      utils.transaction.getAll.invalidate();
    },
    onError: (err) => {
      alert(err.message || "Gagal membuka kembali periode.");
    },
  });

  const handleOpenExecuteModal = () => {
    setExecuteSuccessMsg(null);
    setExecuteErrorMsg(null);
    setConfirmText("");
    setIsExecuteOpen(true);
    refetchPreview();
  };

  const handleConfirmClosing = (e: React.FormEvent) => {
    e.preventDefault();
    setExecuteErrorMsg(null);

    if (confirmText.trim().toUpperCase() !== "CLOSING") {
      setExecuteErrorMsg('Ketik "CLOSING" dengan huruf kapital untuk mengonfirmasi.');
      return;
    }

    executeMutation.mutate({ period: selectedClosingPeriod });
  };

  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");

  // Loading Sesi Profil
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

  // Proteksi Akses Khusus OWNER
  if (!isOwner) {
    return <AccessDeniedCard pageName="Otomatisasi Closing Bulanan" />;
  }

  const isCurrentPeriodClosed = previewData?.isClosed;
  const itemsSnapshotList: Array<{ productName?: string; physicalStock?: number; systemStock?: number }> =
    Array.isArray(selectedArchiveDetail?.itemsSnapshot)
      ? (selectedArchiveDetail.itemsSnapshot as Array<{ productName?: string; physicalStock?: number; systemStock?: number }>)
      : [];

  return (
    <div className="space-y-6 font-sans">
      {/* ──────────────── TOP HEADER (IDENTIK DENGAN DASHBOARD, PRODUK, TRANSAKSI & STAF) ──────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Otomatisasi Closing Bulanan
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#172554]/10 text-[#172554] border border-[#172554]/20">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Owner
            </span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]" suppressHydrationWarning>
            {todayFormatted} · {getGreeting()}, {userName}. Kunci buku periode, lakukan carry-over stok fisik, dan kirimkan laporan via SMTP.
          </p>
        </div>

        {/* Action: Eksekusi Closing Button & Reopen Button */}
        <div className="flex items-center gap-2.5">
          {isCurrentPeriodClosed && (
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirm(
                    `Apakah Anda yakin ingin membuka kembali (Reopen) periode ${currentPeriod}? Transaksi dan stok akan dapat dicatat kembali.`
                  )
                ) {
                  reopenMutation.mutate({ period: currentPeriod });
                }
              }}
              disabled={reopenMutation.isPending}
              className="h-10 gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#DC2626] shadow-sm hover:bg-[#FEF2F2]"
            >
              <Unlock className="h-4 w-4" />
              {reopenMutation.isPending ? "Membuka..." : "Buka Kunci Periode (Reopen)"}
            </Button>
          )}

          <Button
            onClick={handleOpenExecuteModal}
            disabled={isCurrentPeriodClosed}
            className={`h-10 gap-2 rounded-xl px-4 font-medium text-white shadow-sm transition-all active:scale-[0.98] ${
              isCurrentPeriodClosed
                ? "bg-[#64748B] cursor-not-allowed opacity-80"
                : "bg-[#2563EB] hover:bg-[#1D4ED8]"
            }`}
          >
            {isCurrentPeriodClosed ? (
              <>
                <Lock className="h-4 w-4" />
                Periode Terkunci (Closed)
              </>
            ) : (
              <>
                <CalendarCheck2 className="h-4 w-4 stroke-[2.2]" />
                Eksekusi Closing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ──────────────── 3 METRIC SUMMARY CARDS (PERSIS DENGAN KARTU DASHBOARD) ──────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Status Periode Berjalan */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Status buku periode {currentPeriod}
              </span>
              <Lock
                className={`h-4.5 w-4.5 ${
                  isCurrentPeriodClosed ? "text-[#16A34A]" : "text-[#2563EB]"
                }`}
                strokeWidth={1.8}
              />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                {isCurrentPeriodClosed ? "TERKUNCI" : "TERBUKA"}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isCurrentPeriodClosed
                      ? "bg-[#DCFCE7] text-[#16A34A]"
                      : "bg-[#EFF6FF] text-[#2563EB]"
                  }`}
                >
                  {isCurrentPeriodClosed ? "Closed" : "Active"}
                </span>
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {isCurrentPeriodClosed
                  ? "Transaksi periode ini telah dikunci permanen"
                  : "Menerima pencatatan transaksi harian kasir"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Estimasi Laba Bersih Periode Ini */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Estimasi laba bersih periode ini
              </span>
              <TrendingUp className="h-4.5 w-4.5 text-[#16A34A]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#16A34A]">
                {formatRupiah(previewData?.netProfit ?? 0)}
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Omzet: {formatRupiah(previewData?.totalRevenue ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Arsip Penutupan Buku */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Total arsip closing tersimpan
              </span>
              <Archive className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {closings.length} Laporan
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Arsip laporan penutupan buku terdahulu
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ──────────────── MAIN RIWAYAT CLOSING TABLE CARD ──────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardContent className="p-0">
          {/* Header Baris Dalam Kartu */}
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Riwayat Closing &amp; Arsip Laporan
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Arsip laporan penutupan buku resmi dari bulan-bulan terdahulu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#172554]/10 px-2.5 py-1 text-xs font-semibold text-[#172554]">
                <Clock className="h-3 w-3" /> Auto-Closing Cron Aktif (23:59)
              </span>
            </div>
          </div>

          {/* Konten Tabel Riwayat Closing */}
          {isClosingsLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
              <p className="text-xs text-[#64748B]">Memuat arsip riwayat closing...</p>
            </div>
          ) : closingsError ? (
            <div className="py-10 text-center text-xs text-[#DC2626]">
              Gagal memuat arsip closing: {closingsError.message}
            </div>
          ) : closings.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#94A3B8]">
                <Archive className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                Belum ada arsip penutupan buku
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Lakukan eksekusi closing bulanan perdana untuk mengunci periode dan mengarsipkan laporan pembukuan.
              </p>
              <Button
                onClick={handleOpenExecuteModal}
                className="mt-4 h-9 gap-1.5 rounded-xl bg-[#2563EB] text-xs font-medium text-white hover:bg-[#1D4ED8]"
              >
                <CalendarCheck2 className="h-3.5 w-3.5" /> Eksekusi Closing Sekarang
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3 px-3">Periode Buku</th>
                    <th className="py-3 px-3 text-right">Total Omzet</th>
                    <th className="py-3 px-3 text-right">Modal Pokok (HPP)</th>
                    <th className="py-3 px-3 text-right">Laba Bersih</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Waktu Ditutup &amp; Otorisator</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {closings.map((c) => {
                    const isClosed = c.status === "CLOSED";

                    return (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-[#F8FAFC]"
                      >
                        {/* Periode Buku */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[#0F172A]">
                              {dayjs(c.period).format("MMMM YYYY")}
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              Kode Periode: {c.period}
                            </span>
                          </div>
                        </td>

                        {/* Total Omzet */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-[#0F172A]">
                          {formatRupiah(Number(c.totalRevenue))}
                        </td>

                        {/* Modal Pokok */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap text-[#64748B]">
                          {formatRupiah(Number(c.totalCapital))}
                        </td>

                        {/* Laba Bersih */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-[#16A34A]">
                          +{formatRupiah(Number(c.netProfit))}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isClosed
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : "bg-[#FEF3C7] text-[#D97706]"
                            }`}
                          >
                            {isClosed ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                CLOSED
                              </>
                            ) : (
                              "DRAFT"
                            )}
                          </span>
                        </td>

                        {/* Waktu & Ditutup Oleh */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#0F172A]">
                              {c.closedBy?.fullName || "Sistem Otomatis (Cron)"}
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              {dayjs(c.closedAt).format("DD MMM YYYY, HH:mm")} WIB
                            </span>
                          </div>
                        </td>

                        {/* Aksi Detail */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedArchiveDetail(c);
                              setIsArchiveDetailOpen(true);
                            }}
                            className="h-8 gap-1 rounded-xl px-2.5 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Rincian
                          </Button>
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

      {/* ──────────────── MODAL EKSEKUSI CLOSING (PREVIEW & KONFIRMASI) ──────────────── */}
      <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <form onSubmit={handleConfirmClosing}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                  <CalendarCheck2 className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="text-lg font-bold text-[#0F172A]">
                    Eksekusi Closing Periode {selectedClosingPeriod}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#64748B]">
                    Preview kalkulasi bulanan, carry-over stok fisik ke bulan baru, dan pengiriman email laporan via SMTP.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {executeErrorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>{executeErrorMsg}</p>
                </div>
              )}

              {executeSuccessMsg && (
                <div className="rounded-xl bg-[#F0FDF4] p-3.5 text-xs text-[#166534] border border-[#BBF7D0] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    {executeSuccessMsg}
                  </div>
                  <p className="text-[11px] text-[#15803D]">
                    Laporan penutupan buku berhasil dikirimkan ke email Owner via SMTP/Resend. Periode resmi dikunci.
                  </p>
                </div>
              )}

              {/* Selector Periode */}
              <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                <div className="text-xs text-[#64748B]">
                  Pilih Periode yang akan di-closing:
                </div>
                <input
                  type="month"
                  value={selectedClosingPeriod}
                  onChange={(e) => setSelectedClosingPeriod(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Loading State Preview */}
              {isPreviewLoading ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                  <p className="text-xs text-[#64748B]">Mengkalkulasi preview bulanan...</p>
                </div>
              ) : previewData ? (
                <>
                  {/* Grid Preview Finansial */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                      <span className="text-[11px] text-[#64748B]">Total Omzet</span>
                      <p className="mt-1 font-bold text-sm text-[#0F172A]">
                        {formatRupiah(previewData.totalRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                      <span className="text-[11px] text-[#64748B]">Pengeluaran Modal</span>
                      <p className="mt-1 font-bold text-sm text-[#0F172A]">
                        {formatRupiah(previewData.totalCapital)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                      <span className="text-[11px] text-[#166534] font-medium">Laba Bersih</span>
                      <p className="mt-1 font-bold text-sm text-[#16A34A]">
                        {formatRupiah(previewData.netProfit)}
                      </p>
                    </div>
                  </div>

                  {/* Ringkasan Carry-Over Stok */}
                  <div className="rounded-xl border border-[#E2E8F0] p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-[#2563EB]" />
                        Carry-over Stok Fisik ke Periode Baru
                      </span>
                      <span className="font-medium text-[#2563EB]">
                        Periode {previewData.nextPeriod}
                      </span>
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-[#F1F5F9] text-xs">
                      {previewData.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between py-1.5"
                        >
                          <span className="text-[#0F172A] font-medium">
                            {item.productName}
                          </span>
                          <span className="text-[#64748B]">
                            Carry-over:{" "}
                            <strong className="text-[#0F172A]">
                              {item.physicalStock} unit
                            </strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Jalur Distribusi SMTP / Resend */}
                  <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3 text-xs text-[#1E40AF] flex items-start gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
                    <div>
                      <p className="font-semibold">Distribusi Laporan via Email SMTP</p>
                      <p className="text-[11px] text-[#1E3A8A] mt-0.5">
                        Laporan rekapitulasi resmi akan otomatis dikirimkan ke email Anda (
                        <strong>{profile?.email}</strong>) saat penutupan buku dieksekusi.
                      </p>
                    </div>
                  </div>

                  {/* Input Konfirmasi Keamanan */}
                  {!previewData.isClosed && !executeSuccessMsg && (
                    <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                      <Label className="text-xs font-semibold text-[#0F172A]">
                        Konfirmasi Penutupan Buku <span className="text-[#DC2626]">*</span>
                      </Label>
                      <p className="text-[11px] text-[#64748B]">
                        Ketik <strong className="text-[#0F172A]">CLOSING</strong> di bawah ini untuk mengunci periode secara permanen:
                      </p>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder='Ketik "CLOSING"'
                        required
                        className="h-10 rounded-xl border-[#E2E8F0] text-xs font-bold uppercase tracking-wider"
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {executeErrorMsg && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{executeErrorMsg}</p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExecuteOpen(false)}
                className="h-10 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                {executeSuccessMsg ? "Selesai" : "Batal"}
              </Button>
              {!previewData?.isClosed && !executeSuccessMsg && (
                <Button
                  type="submit"
                  disabled={executeMutation.isPending || confirmText.trim().toUpperCase() !== "CLOSING"}
                  className="h-10 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {executeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Mengeksekusi Closing &amp; Mengirim Email...
                    </>
                  ) : (
                    "Konfirmasi & Kunci Periode"
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────── MODAL DETAIL ARSIP CLOSING ──────────────── */}
      <Dialog open={isArchiveDetailOpen} onOpenChange={setIsArchiveDetailOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#172554]/10 text-[#172554]">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-[#0F172A]">
                  Arsip Closing Periode {selectedArchiveDetail?.period}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B]">
                  Laporan resmi penutupan buku yang tersimpan di sistem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedArchiveDetail && (
            <div className="space-y-4 py-2">
              {/* Box Status Terkunci */}
              <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#166534]">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  Periode Telah Dikunci Resmi (CLOSED)
                </div>
                <p className="mt-1 text-[11px] text-[#15803D]">
                  Ditutup oleh {selectedArchiveDetail.closedBy?.fullName || "Sistem"} pada{" "}
                  {selectedArchiveDetail.closedAt
                    ? dayjs(selectedArchiveDetail.closedAt).format("DD MMMM YYYY, HH:mm:ss")
                    : "-"}{" "}
                  WIB.
                </p>
              </div>

              {/* Rincian Finansial */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Total Pemasukan (Omzet)</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatRupiah(Number(selectedArchiveDetail.totalRevenue))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Total Pengeluaran Modal (HPP)</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatRupiah(Number(selectedArchiveDetail.totalCapital))}
                  </span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex items-center justify-between font-bold text-sm text-[#16A34A]">
                  <span>Keuntungan Bersih (Net Profit)</span>
                  <span>+{formatRupiah(Number(selectedArchiveDetail.netProfit))}</span>
                </div>
              </div>

              {/* Snapshot Produk Hasil Opname & Carry-over */}
              <div className="rounded-xl border border-[#E2E8F0] p-3.5 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Snapshot Stok Produk Terkunci
                </p>
                <div className="max-h-40 overflow-y-auto divide-y divide-[#F1F5F9] text-xs">
                  {itemsSnapshotList.map((item: itemSnapshot, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span className="font-medium text-[#0F172A]">
                        {item.productName}
                      </span>
                      <span className="text-[#64748B]">
                        Stok Akhir: <strong>{item.physicalStock ?? item.systemStock} unit</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsArchiveDetailOpen(false)}
              className="w-full rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Tutup Arsip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
