"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  Package,
  ShieldCheck,
  UserCheck,
  ArrowRight,
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

// Salam waktu (Pagi/Siang/Sore/Malam)
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export default function DashboardPage() {
  const utils = trpc.useUtils();

  // 1. Ambil profile user aktif (Role Owner / Staff)
  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();

  const isOwner = profile?.role === ROLE.OWNER;
  const isStaff = profile?.role === ROLE.STAFF;

  // 2. Fetch data murni sesuai role dari database
  const {
    data: ownerData,
    isLoading: isOwnerLoading,
  } = trpc.dashboard.getOwnerDashboard.useQuery(undefined, {
    enabled: isOwner,
  });

  const {
    data: staffData,
    isLoading: isStaffLoading,
  } = trpc.dashboard.getStaffDashboard.useQuery(undefined, {
    enabled: isStaff,
  });

  // 3. Data produk untuk modal "+ Tambah transaksi"
  const { data: productList } = trpc.product.getAllProducts.useQuery();

  // State Dialog Tambah Transaksi
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [txError, setTxError] = useState<string | null>(null);

  const createTxMutation = trpc.transaction.create.useMutation({
    onSuccess: () => {
      setIsTxOpen(false);
      resetTxForm();
      utils.dashboard.getOwnerDashboard.invalidate();
      utils.dashboard.getStaffDashboard.invalidate();
    },
    onError: (err) => {
      setTxError(err.message);
    },
  });

  const resetTxForm = () => {
    setSelectedProductId("");
    setQuantity(1);
    setCostPrice(0);
    setSellingPrice(0);
    setTxError(null);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = productList?.find((p) => p.id === productId);
    if (prod) {
      setCostPrice(Number(prod.defaultCost) || 0);
      setSellingPrice(Number(prod.defaultPrice) || 0);
    }
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    if (!selectedProductId) {
      setTxError("Silakan pilih produk terlebih dahulu");
      return;
    }

    const currentPeriod = dayjs().format("YYYY-MM");
    createTxMutation.mutate({
      productId: selectedProductId,
      period: currentPeriod,
      quantity: Number(quantity) || 1,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
    });
  };

  const isLoading =
    isProfileLoading || (isOwner && isOwnerLoading) || (isStaff && isStaffLoading);

  // Tanggal & Hari ini
  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");
  const userName = profile?.fullName?.split(" ")[0] || "Pengguna";

  // Data MURNI dari database (0 jika belum ada transaksi)
  const revenueThisMonth = isOwner
    ? (ownerData?.monthSummary?.totalRevenue ?? 0)
    : (staffData?.monthSummary?.totalRevenue ?? 0);

  const capitalThisMonth = isOwner
    ? (ownerData?.monthSummary?.totalCapital ?? 0)
    : 0;

  const profitThisMonth = isOwner
    ? (ownerData?.monthSummary?.totalProfit ?? 0)
    : 0;

  const txCountThisMonth = isOwner
    ? (ownerData?.monthSummary?.transactionCount ?? 0)
    : (staffData?.monthSummary?.transactionCount ?? 0);

  // Recent transactions list riil
  const recentTransactions = isOwner
    ? ownerData?.recentTransactions ?? []
    : staffData?.recentTransactions ?? [];

  // Low stock items riil
  const lowStockItems = ownerData?.lowStockItems ?? [];

  // Cash flow chart data riil 6 bulan
  const cashFlowData = ownerData?.cashFlow ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="text-sm font-medium text-[#64748B]">
          Memuat data dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ──────────────── TOP HEADER ──────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Ringkasan keuangan
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOwner
                  ? "bg-[#172554]/10 text-[#172554] border border-[#172554]/20"
                  : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              }`}
            >
              {isOwner ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Owner
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Staff
                </>
              )}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]" suppressHydrationWarning>
            {todayFormatted} · {getGreeting()}, {userName}.
          </p>
        </div>

        {/* Action: Tambah Transaksi Modal */}
        <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 gap-2 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-[0.98]">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Tambah transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
            <form onSubmit={handleCreateTx}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#0F172A]">
                  Catat Transaksi Penjualan
                </DialogTitle>
                <DialogDescription className="text-sm text-[#64748B]">
                  Pilih produk dan tentukan jumlah unit yang terjual.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {txError && (
                  <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                    {txError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="product" className="text-xs font-semibold text-[#0F172A]">
                    Produk
                  </Label>
                  <select
                    id="product"
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    <option value="">-- Pilih Produk Master --</option>
                    {productList?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {p.initialStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty" className="text-xs font-semibold text-[#0F172A]">
                      Jumlah (Qty)
                    </Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                      className="rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-semibold text-[#0F172A]">
                      Harga Jual Satuan
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      required
                      className="rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 text-xs text-[#64748B] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Total Penjualan:</span>
                    <span className="font-semibold text-[#0F172A] text-sm">
                      {formatRupiah(sellingPrice * quantity)}
                    </span>
                  </div>
                  {isOwner && (
                    <div className="flex justify-between items-center text-[#64748B] border-t border-[#E2E8F0] pt-1.5">
                      <span>Estimasi Laba Kotor:</span>
                      <span className="font-semibold text-[#16A34A] text-sm">
                        {formatRupiah((sellingPrice - costPrice) * quantity)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTxOpen(false)}
                  className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1D4ED8]"
                  disabled={createTxMutation.isPending}
                >
                  {createTxMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Simpan Transaksi
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ──────────────── TOP 3 METRIC CARDS ──────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Saldo / Total Laba (Owner) atau Total Penjualan (Staff) */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                {isOwner ? "Saldo keuntungan" : "Total Penjualan Saya"}
              </span>
              <Wallet className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {isOwner
                  ? formatRupiah(profitThisMonth)
                  : formatRupiah(revenueThisMonth)}
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {txCountThisMonth > 0
                  ? `${txCountThisMonth} transaksi berhasil dicatat`
                  : "Belum ada transaksi bulan ini"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pemasukan bulan ini */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                Pemasukan bulan ini
              </span>
              <ArrowDownLeft className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {formatRupiah(revenueThisMonth)}
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {txCountThisMonth > 0
                  ? `${txCountThisMonth} transaksi masuk`
                  : "Belum ada pemasukan bulan ini"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pengeluaran bulan ini (Owner) atau Total Produk (Staff) */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#64748B]">
                {isOwner ? "Pengeluaran modal" : "Katalog Produk Aktif"}
              </span>
              {isOwner ? (
                <ArrowUpRight className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
              ) : (
                <Package className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.8} />
              )}
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {isOwner
                  ? formatRupiah(capitalThisMonth)
                  : `${staffData?.totalProducts ?? 0} Produk`}
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {isOwner
                  ? capitalThisMonth > 0
                    ? "Total modal produk terjual"
                    : "Belum ada pengeluaran modal"
                  : "Tersedia untuk transaksi kasir"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ──────────────── MIDDLE ROW: ARUS KAS & PERLU DITINJAU ──────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Arus Kas Chart Card (2 Cols) */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Arus kas
              </h3>
              <span className="text-xs font-normal text-[#94A3B8]">
                6 bulan terakhir · rupiah
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="relative mt-6 h-48 w-full">
              <CashFlowChart data={cashFlowData} />
            </div>

            {/* Chart Legend / Summary */}
            <div className="mt-6 flex flex-wrap items-center justify-between border-t border-[#F1F5F9] pt-4 text-xs">
              <div className="text-xs font-medium text-[#2563EB]">
                Pemasukan · {formatRupiah(revenueThisMonth)}
              </div>
              {isOwner && (
                <div className="text-xs font-medium text-[#64748B]">
                  Pengeluaran · {formatRupiah(capitalThisMonth)}
                </div>
              )}
              <span className="text-xs font-medium text-[#64748B]">
                {dayjs().format("MMM YYYY")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Perlu Ditinjau Card (1 Col) */}
        <Card className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <CardContent className="p-0">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Perlu ditinjau
            </h3>

            <div className="mt-6">
              {isOwner ? (
                lowStockItems.length > 0 ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-medium text-[#D97706]">
                      <Clock className="h-3.5 w-3.5 text-[#D97706]" strokeWidth={2} />
                      <span>{lowStockItems.length} stok menipis</span>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                        {lowStockItems.length} Produk
                      </h2>
                      <p className="mt-1 text-xs text-[#94A3B8]">
                        Stok di bawah 10 unit, disarankan segera restock.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#16A34A]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" strokeWidth={2} />
                      <span>Semua Stok Aman</span>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                        Stok Aman
                      </h2>
                      <p className="mt-1 text-xs text-[#94A3B8]">
                        Tidak ada produk dengan stok menipis saat ini.
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#2563EB]">
                    <Package className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />
                    <span>Info Operasional</span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                      Siap Melayani
                    </h2>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Katalog produk siap untuk pencatatan transaksi kasir.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <div className="mt-6 border-t border-[#F1F5F9] pt-4">
            <Link
              href="/product"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
            >
              {isOwner ? "Lihat stok produk" : "Katalog Produk"}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Card>
      </div>

      {/* ──────────────── BOTTOM ROW: TRANSAKSI TERBARU ──────────────── */}
      <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardContent className="p-0">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Transaksi terbaru
            </h3>
            <Link
              href="/transaksi"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
            >
              Lihat semua
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {tx.productName}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      TRX-{String(tx.id || "").slice(0, 6).toUpperCase()} ·{" "}
                      {dayjs(tx.createdAt).isValid()
                        ? dayjs(tx.createdAt).format("DD MMM YYYY")
                        : "Hari ini"} · Oleh {tx.createdByName || "Staff"}
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <span className="text-sm font-semibold tracking-tight text-[#0F172A]">
                      +{formatRupiah((Number(tx.sellingPrice) || 0) * (Number(tx.quantity) || 1))}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-medium text-[#16A34A]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" strokeWidth={2} />
                      Lunas
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-[#64748B]">
                  Belum ada transaksi yang tercatat
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Klik tombol &quot;+ Tambah transaksi&quot; di atas untuk mulai mencatat penjualan.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────── KOMPONEN LINE CHART SVG MINIMALIS ────────────────
function CashFlowChart({
  data,
}: {
  data?: { period: string; pemasukan: number; pengeluaran: number }[];
}) {
  const width = 600;
  const height = 180;
  const paddingX = 35;
  const paddingY = 20;

  // Jika data belum ada dari backend, buatkan 6 titik bulan terakhir dengan nilai 0
  const chartData =
    data && data.length > 0
      ? data
      : [
          { period: "Bln 1", pemasukan: 0, pengeluaran: 0 },
          { period: "Bln 2", pemasukan: 0, pengeluaran: 0 },
          { period: "Bln 3", pemasukan: 0, pengeluaran: 0 },
          { period: "Bln 4", pemasukan: 0, pengeluaran: 0 },
          { period: "Bln 5", pemasukan: 0, pengeluaran: 0 },
          { period: "Bln 6", pemasukan: 0, pengeluaran: 0 },
        ];

  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(Number(d.pemasukan) || 0, Number(d.pengeluaran) || 0)),
    1_000_000
  );

  const divisor = Math.max(chartData.length - 1, 1);

  const getX = (index: number) => {
    return paddingX + (index / divisor) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((Number(val) || 0) / maxVal) * (height - 2 * paddingY);
  };

  const pemasukanPoints = chartData
    .map((d, i) => `${getX(i)},${getY(d.pemasukan)}`)
    .join(" ");

  const pengeluaranPoints = chartData
    .map((d, i) => `${getX(i)},${getY(d.pengeluaran)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
    >
      {/* Grid Lines Horisontal */}
      {[0, 0.5, 1].map((ratio) => {
        const y = height - paddingY - ratio * (height - 2 * paddingY);
        const label = Math.round(ratio * maxVal);
        return (
          <g key={ratio}>
            <line
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
            <text
              x={paddingX - 10}
              y={y + 3.5}
              textAnchor="end"
              className="fill-[#94A3B8] text-[9px] font-sans"
            >
              {label >= 1_000_000
                ? `${Math.round(label / 1_000_000)}jt`
                : label >= 1_000
                ? `${Math.round(label / 1_000)}rb`
                : label}
            </text>
          </g>
        );
      })}

      {/* Garis Pengeluaran (Garis Abu-abu Slate Putus-putus) */}
      <polyline
        fill="none"
        stroke="#64748B"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pengeluaranPoints}
      />

      {/* Garis Pemasukan (Garis Biru Accent Solid) */}
      <polyline
        fill="none"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pemasukanPoints}
      />
    </svg>
  );
}
