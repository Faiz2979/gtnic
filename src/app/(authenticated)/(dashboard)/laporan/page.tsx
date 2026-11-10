"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccessDeniedCard } from "@/components/access-denied";
import {
  TrendingUp,
  Package,
  Wallet,
  Percent,
  Calendar,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Banknote,
  Users,
  Award,
  CheckCircle2,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";

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

export default function LaporanPage() {
  // 1. Data Profil Pengguna Aktif
  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;
  const userName = profile?.fullName?.split(" ")[0] || "Pengguna";

  // 2. State Periode & Tab
  const currentMonth = dayjs().format("YYYY-MM");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonth);
  const [activeTab, setActiveTab] = useState<"pnl" | "cashflow" | "products" | "staff">("pnl");
  const [businessName, setBusinessName] = useState("PT GTNIC KREATIF INDONESIA");

  useEffect(() => {
    const saved = localStorage.getItem("finara_business_name");
    if (saved) setBusinessName(saved);
  }, []);

  // 3. Query Laporan Komprehensif
  const {
    data: report,
    isLoading: isReportLoading,
    refetch: refetchReport,
  } = trpc.report.getComprehensiveReport.useQuery({
    period: selectedPeriod,
  }, {
    enabled: isOwner,
  });

  const summary = report?.summary;
  const cashFlow = report?.cashFlow;
  const products = report?.products || [];
  const staff = report?.staff || [];
  const availablePeriods = report?.availablePeriods || [currentMonth];

  // Helper Cetak Laporan
  const handlePrint = () => {
    window.print();
  };

  // Helper Ekspor CSV
  const handleExportCSV = () => {
    if (!report) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `LAPORAN KEUANGAN & BISNIS - PERIODE ${selectedPeriod}\n\n`;

    csvContent += "RINGKASAN EKSEKUTIF\n";
    csvContent += `Total Omzet Penjualan,${summary?.totalRevenue || 0}\n`;
    csvContent += `Beban Pokok Penjualan (HPP),${summary?.totalCost || 0}\n`;
    csvContent += `Laba Kotor,${summary?.grossProfit || 0}\n`;
    csvContent += `Beban Operasional,${summary?.operatingExpenses || 0}\n`;
    csvContent += `Laba Bersih Akhir,${summary?.netProfit || 0}\n`;
    csvContent += `Margin Keuntungan (%),${summary?.profitMargin || 0}%\n`;
    csvContent += `Total Transaksi,${summary?.totalTransactions || 0}\n\n`;

    csvContent += "PERFORMA PRODUK TERJUAL\n";
    csvContent += "Nama Produk,Kuantitas Terjual,Total Omzet,Total Laba,Sisa Stok Fisik\n";
    products.forEach((p) => {
      csvContent += `"${p.productName}",${p.unitsSold},${p.revenue},${p.profit},${p.currentStock}\n`;
    });
    csvContent += "\n";

    csvContent += "KONTRIBUSI STAF KASIR\n";
    csvContent += "Nama Staf,Peran,Jumlah Transaksi,Total Omzet,Kontribusi (%)\n";
    staff.forEach((s) => {
      csvContent += `"${s.staffName}",${s.role},${s.transactionCount},${s.totalSales},${s.contributionPercent}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan-Keuangan-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Proteksi Hak Akses Khusus OWNER
  if (isProfileLoading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-slate-500">Memverifikasi hak akses...</p>
      </div>
    );
  }

  if (!isOwner) {
    return <AccessDeniedCard pageName="Laporan & Analisis Bisnis" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Finara Design */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <span>{dayjs().format("dddd, D MMMM YYYY")}</span>
            <span>•</span>
            <span>{getGreeting()}, {userName}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Laporan & Analisis Bisnis
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
            Pusat laporan performa keuangan resmi, neraca laba rugi, arus kas, dan analisis produk terlaris.
          </p>
        </div>

        {/* Filter Periode & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Periode */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  Periode {p}
                </option>
              ))}
              <option value="ALL">Semua Periode</option>
            </select>
          </div>

          {/* Cetak PDF */}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-sm h-10 px-3.5"
            title="Cetak Laporan Resmi"
          >
            <Printer className="mr-1.5 h-4 w-4 text-slate-600" />
            Cetak PDF
          </Button>

          {/* Ekspor CSV */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-sm h-10 px-3.5"
            title="Ekspor ke File CSV"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
            Ekspor CSV
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchReport()}
            title="Refresh Data"
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kop Cetak PDF (Hanya Muncul Saat Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
              {businessName}
            </h1>
            <p className="text-xs text-slate-600">
              Laporan Keuangan & Rekapitulasi Bisnis — Periode: {selectedPeriod}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Dicetak pada: {dayjs().format("DD MMMM YYYY, HH:mm")}</div>
            <div>Oleh: {userName} ({isOwner ? "Owner" : "Staff"})</div>
          </div>
        </div>
      </div>

      {/* 4 Finara Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Omzet */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Pendapatan (Omzet)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {isReportLoading ? "Memuat..." : formatRupiah(summary?.totalRevenue ?? 0)}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Dari {summary?.totalTransactions ?? 0} transaksi tercatat
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Beban Pokok Penjualan (HPP) */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Beban Pokok Penjualan (HPP)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {isReportLoading ? "Memuat..." : formatRupiah(summary?.totalCost ?? 0)}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Total modal barang terjual
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Laba Bersih Usaha */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Laba Bersih Usaha
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-emerald-600">
                {isReportLoading ? "Memuat..." : formatRupiah(summary?.netProfit ?? 0)}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Setelah modal & beban operasional
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Margin Keuntungan
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-indigo-600">
                {isReportLoading ? "Memuat..." : `${summary?.profitMargin ?? 0}%`}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Rasio efisiensi laba bersih
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Table Section */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-100 px-6 pt-4 flex gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("pnl")}
            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "pnl"
                ? "border-[#172554] text-[#172554]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            Laba Rugi (P&L)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cashflow")}
            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "cashflow"
                ? "border-[#172554] text-[#172554]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Banknote className="h-4 w-4" />
            Arus Kas & Rekening
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "products"
                ? "border-[#172554] text-[#172554]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="h-4 w-4" />
            Performa Produk ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "staff"
                ? "border-[#172554] text-[#172554]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Kinerja Staf Kasir ({staff.length})
          </button>
        </div>

        {/* Tab 1: Laporan Laba Rugi (P&L Statement) */}
        {(activeTab === "pnl" || typeof window === "undefined") && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Laporan Laba Rugi Komprehensif
              </h2>
              <p className="text-xs text-slate-500">
                Rincian kalkulasi pendapatan, biaya modal barang, dan laba operasional periode {selectedPeriod}.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-sm">
              {/* I. Pendapatan */}
              <div className="p-4 bg-slate-50/60 flex items-center justify-between font-semibold text-slate-800">
                <span>I. PENDAPATAN USAHA (REVENUE)</span>
                <span className="font-bold text-[#0F172A]">{formatRupiah(summary?.totalRevenue ?? 0)}</span>
              </div>
              <div className="p-4 pl-8 flex items-center justify-between text-xs text-slate-600">
                <span>Penjualan Produk Kasir ({summary?.totalTransactions ?? 0} Transaksi)</span>
                <span className="font-medium text-slate-800">{formatRupiah(summary?.totalRevenue ?? 0)}</span>
              </div>

              {/* II. HPP */}
              <div className="p-4 bg-slate-50/60 flex items-center justify-between font-semibold text-slate-800">
                <span>II. HARGA POKOK PENJUALAN (HPP / MODAL BARANG)</span>
                <span className="font-bold text-red-600">({formatRupiah(summary?.totalCost ?? 0)})</span>
              </div>
              <div className="p-4 pl-8 flex items-center justify-between text-xs text-slate-600">
                <span>Total Pengeluaran Modal Produk Terjual</span>
                <span className="font-medium text-slate-800">{formatRupiah(summary?.totalCost ?? 0)}</span>
              </div>

              {/* III. Laba Kotor */}
              <div className="p-4 bg-blue-50/60 flex items-center justify-between font-bold text-blue-950">
                <span>III. LABA KOTOR (GROSS PROFIT)</span>
                <span className="text-blue-700 text-base">{formatRupiah(summary?.grossProfit ?? 0)}</span>
              </div>

              {/* IV. Beban Operasional */}
              <div className="p-4 bg-slate-50/60 flex items-center justify-between font-semibold text-slate-800">
                <span>IV. BEBAN OPERASIONAL (OPERATING EXPENSES)</span>
                <span className="font-bold text-red-600">({formatRupiah(summary?.operatingExpenses ?? 0)})</span>
              </div>
              <div className="p-4 pl-8 flex items-center justify-between text-xs text-slate-600">
                <span>Pengeluaran Operasional & Kas Toko</span>
                <span className="font-medium text-slate-800">{formatRupiah(summary?.operatingExpenses ?? 0)}</span>
              </div>

              {/* V. Laba Bersih */}
              <div className="p-5 bg-[#172554] text-white flex items-center justify-between rounded-b-2xl font-bold">
                <div>
                  <div className="text-sm tracking-wide">V. LABA BERSIH AKHIR (NET PROFIT)</div>
                  <div className="text-xs text-slate-300 font-normal mt-0.5">
                    Margin Keuntungan Bersih: {summary?.profitMargin ?? 0}%
                  </div>
                </div>
                <div className="text-xl text-emerald-400">
                  {formatRupiah(summary?.netProfit ?? 0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Arus Kas & Posisi Rekening */}
        {activeTab === "cashflow" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Laporan Arus Kas & Saldo Likuid
              </h2>
              <p className="text-xs text-slate-500">
                Rekapitulasi pergerakan uang tunai fisik dan transfer bank pada periode {selectedPeriod}.
              </p>
            </div>

            {/* Ringkasan Arus Kas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  Arus Kas Masuk (Inflow)
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-2">
                  +{formatRupiah(cashFlow?.cashInflow ?? 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Penjualan kasir & mutasi masuk</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <div className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  Arus Kas Keluar (Outflow)
                </div>
                <div className="text-xl font-bold text-red-700 mt-2">
                  -{formatRupiah(cashFlow?.cashOutflow ?? 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Beban operasional & tarik tunai</p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Net Cash Flow (Surplus/Defisit)
                </div>
                <div className="text-xl font-bold text-blue-700 mt-2">
                  {formatRupiah(cashFlow?.netCashFlow ?? 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Selisih arus kas periode ini</p>
              </div>
            </div>

            {/* Posisi Saldo Rekening Saat Ini */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Posisi Saldo Berjalan Rekening & Kas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cashFlow?.accounts.map((acc) => (
                  <div key={acc.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{acc.name}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {acc.bankName}
                      </span>
                    </div>
                    <div className="text-base font-bold text-[#0F172A] mt-1.5">
                      {formatRupiah(acc.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat Mutasi Terkini */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Mutasi Kas Terakhir
              </h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Tanggal</th>
                      <th className="py-2.5 px-4">Rekening</th>
                      <th className="py-2.5 px-4">Keterangan</th>
                      <th className="py-2.5 px-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashFlow?.recentCashMovements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Belum ada catatan mutasi kas pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      cashFlow?.recentCashMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                            {dayjs(m.date).format("DD MMM YYYY, HH:mm")}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">
                            {m.accountName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{m.description}</td>
                          <td
                            className={`py-2.5 px-4 text-right font-bold ${
                              m.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {m.type === "INCOME" ? "+" : "-"}
                            {formatRupiah(m.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Performa Produk (Best Seller) */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-[#64748B] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 text-center w-16">Peringkat</th>
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5 text-center">Unit Terjual</th>
                  <th className="px-6 py-3.5 text-right">Total Omzet</th>
                  <th className="px-6 py-3.5 text-right">Kontribusi Laba</th>
                  <th className="px-6 py-3.5 text-center">Sisa Stok Fisik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                      Belum ada penjualan produk pada periode ini.
                    </td>
                  </tr>
                ) : (
                  products.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-xs text-[#0F172A]">
                          {p.productName}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {p.unitsSold} unit
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-xs text-slate-700">
                        {formatRupiah(p.revenue)}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-xs text-emerald-600">
                        +{formatRupiah(p.profit)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.currentStock > 10
                              ? "bg-slate-100 text-slate-700"
                              : p.currentStock > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {p.currentStock} unit
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Kinerja Staf Kasir */}
        {activeTab === "staff" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-[#64748B] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Staf</th>
                  <th className="px-6 py-3.5">Peran (Role)</th>
                  <th className="px-6 py-3.5 text-center">Jumlah Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Total Penjualan</th>
                  <th className="px-6 py-3.5 text-center">Kontribusi Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                      Belum ada kontribusi staf tercatat.
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.staffId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-xs text-[#0F172A]">
                          {s.staffName}
                        </div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.role === "OWNER"
                              ? "bg-[#172554]/10 text-[#172554]"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-medium text-xs text-slate-700">
                        {s.transactionCount} transaksi
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-xs text-[#0F172A]">
                        {formatRupiah(s.totalSales)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#2563EB] h-full rounded-full"
                              style={{ width: `${Math.min(100, s.contributionPercent)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {s.contributionPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Lembar Tanda Tangan Cetak PDF (Hanya Muncul Saat Print) */}
      <div className="hidden print:block pt-12 mt-12 border-t border-slate-300">
        <div className="grid grid-cols-2 text-center text-xs text-slate-700">
          <div>
            <p>Dibuat oleh,</p>
            <div className="h-16" />
            <p className="font-bold underline">{userName}</p>
            <p className="text-slate-500">Staf Operasional</p>
          </div>
          <div>
            <p>Disetujui oleh,</p>
            <div className="h-16" />
            <p className="font-bold underline">Pemilik Usaha (Owner)</p>
            <p className="text-slate-500">{businessName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

