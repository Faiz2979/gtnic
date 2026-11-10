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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/utils/enums/user-role.enum";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Plus,
  ShieldCheck,
  UserCheck,
  Wallet,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

dayjs.locale("id");

const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function DashboardPage() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();

  const isOwner = profile?.role === ROLE.OWNER;
  const isStaff = profile?.role === ROLE.STAFF;

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

  // 3. Data produk & rekening untuk modal "+ Tambah transaksi"
  const { data: productList } = trpc.product.getAllProducts.useQuery();
  const { data: accountList = [] } = trpc.account.getAllAccounts.useQuery();

  const [isTxOpen, setIsTxOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [txError, setTxError] = useState<string | null>(null);

  // Set default rekening
  useEffect(() => {
    if (!selectedAccountId && accountList.length > 0) {
      const primary = accountList.find((a) => a.isPrimary && a.isActive) || accountList.find((a) => a.isActive);
      if (primary) setSelectedAccountId(primary.id);
    }
  }, [accountList, selectedAccountId]);

  const createTxMutation = trpc.transaction.create.useMutation({
    onSuccess: () => {
      setIsTxOpen(false);
      resetTxForm();
      utils.dashboard.getOwnerDashboard.invalidate();
      utils.dashboard.getStaffDashboard.invalidate();
      utils.account.getAllAccounts.invalidate();
      utils.account.getStats.invalidate();
      utils.account.getRecentMutations.invalidate();
    },
    onError: (err) => {
      setTxError(err.message);
    },
  });

  const resetTxForm = () => {
    setSelectedProductId("");
    const primary = accountList.find((a) => a.isPrimary && a.isActive) || accountList.find((a) => a.isActive);
    setSelectedAccountId(primary ? primary.id : "");
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
      accountId: selectedAccountId || undefined,
      period: currentPeriod,
      quantity: Number(quantity) || 1,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
    });
  };

  const isLoading =
    isProfileLoading || (isOwner && isOwnerLoading) || (isStaff && isStaffLoading);

  const userName = profile?.fullName?.split(" ")[0] || "Pengguna";

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

  const recentTransactions = isOwner
    ? ownerData?.recentTransactions ?? []
    : staffData?.recentTransactions ?? [];

  const lowStockItems = ownerData?.lowStockItems ?? [];

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Halo, {userName}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOwner
                  ? "bg-slate-900 text-white"
                  : "bg-blue-50 text-blue-700 border border-blue-200/60"
              }`}
            >
              {isOwner ? (
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
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {isOwner
              ? "Ringkasan metrik penjualan, perputaran kas, dan aktivitas toko secara real-time."
              : "Portal kasir operasional toko. Catat pesanan dan pantau rekapitulasi penjualan harian Anda."}
          </p>
        </div>

        <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 font-medium text-xs text-white shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto">
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
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

                {/* Metode Pembayaran / Masuk ke Rekening */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dashboard-account" className="text-xs font-semibold text-[#0F172A]">
                      Metode Pembayaran (Rekening Masuk)
                    </Label>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Saldo Otomatis Bertambah
                    </span>
                  </div>
                  <select
                    id="dashboard-account"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    {accountList.filter((a) => a.isActive).map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === "CASH"
                          ? `💵 ${acc.name} (${acc.bankName})`
                          : acc.type === "EWALLET"
                          ? `📱 ${acc.name} (${acc.bankName})`
                          : `🏦 ${acc.bankName} - ${acc.name}`} — Saldo: {formatRupiah(acc.balance)}
                      </option>
                    ))}
                  </select>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Saldo / Total Laba (Owner) atau Total Penjualan (Staff) */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isOwner ? "Saldo Keuntungan" : "Total Penjualan Saya"}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] shadow-xs">
                <Wallet className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {isOwner
                  ? formatRupiah(profitThisMonth)
                  : formatRupiah(revenueThisMonth)}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {txCountThisMonth > 0
                    ? `${txCountThisMonth} transaksi berhasil dicatat`
                    : "Belum ada transaksi bulan ini"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pemasukan bulan ini */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pemasukan Bulan Ini
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                <ArrowDownLeft className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {formatRupiah(revenueThisMonth)}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>
                  {txCountThisMonth > 0
                    ? `${txCountThisMonth} kas masuk tercatat`
                    : "Belum ada pemasukan bulan ini"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pengeluaran bulan ini (Owner) atau Total Produk (Staff) */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isOwner ? "Pengeluaran Modal" : "Katalog Produk Aktif"}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
                {isOwner ? (
                  <ArrowUpRight className="h-4.5 w-4.5" strokeWidth={2} />
                ) : (
                  <Package className="h-4.5 w-4.5" strokeWidth={2} />
                )}
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {isOwner
                  ? formatRupiah(capitalThisMonth)
                  : `${staffData?.totalProducts ?? 0} Produk`}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>
                  {isOwner
                    ? capitalThisMonth > 0
                      ? "Total modal produk terjual"
                      : "Belum ada pengeluaran modal"
                    : "Tersedia untuk transaksi kasir"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ──────────────── MIDDLE ROW: ARUS KAS & PERLU DITINJAU ──────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Arus Kas Chart Card (2 Cols) */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:shadow-md lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#2563EB]" />
                  Arus Kas Toko
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Visualisasi perbandingan pemasukan vs pengeluaran modal
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                6 Bulan Terakhir
              </span>
            </div>

            {/* Custom SVG Line Chart with Gradient Fill */}
            <div className="relative mt-6 h-52 w-full">
              <CashFlowChart data={cashFlowData} />
            </div>

            {/* Chart Legend / Summary */}
            <div className="mt-5 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                <span className="font-semibold text-[#0F172A]">
                  Pemasukan: <span className="text-[#2563EB]">{formatRupiah(revenueThisMonth)}</span>
                </span>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span className="font-semibold text-[#0F172A]">
                    Pengeluaran Modal: <span className="text-slate-600">{formatRupiah(capitalThisMonth)}</span>
                  </span>
                </div>
              )}
              <span className="text-xs font-medium text-slate-400">
                Update Real-Time · {dayjs().format("MMM YYYY")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Perlu Ditinjau Card (1 Col) */}
        <Card className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">
                Perlu Ditinjau
              </h3>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-5">
              {isOwner ? (
                lowStockItems.length > 0 ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Clock className="h-3.5 w-3.5 text-amber-600" strokeWidth={2} />
                      <span>{lowStockItems.length} Stok Menipis</span>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                        {lowStockItems.length} Produk
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Kuantitas fisik di bawah 10 unit. Disarankan melakukan restock agar kasir tidak kehabisan barang.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                      <span>Semua Stok Aman</span>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                        Inventaris Aman
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Seluruh katalog produk memiliki ketersediaan stok fisik yang cukup untuk penjualan.
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-semibold text-[#2563EB]">
                    <Package className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />
                    <span>Info Operasional Shift</span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                      Siap Melayani
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Katalog produk siap untuk pencatatan transaksi kasir hari ini.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link
              href="/product"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:gap-2 transition-all"
            >
              <span>{isOwner ? "Buka Manajemen Stok" : "Lihat Katalog Produk"}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Card>
      </div>

      {/* ──────────────── BOTTOM ROW: TRANSAKSI TERBARU ──────────────── */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Transaksi Penjualan Terbaru
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Riwayat struk kasir yang baru saja tercatat ke sistem
              </p>
            </div>
            <Link
              href="/transaksi"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 pt-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-slate-50/80 transition-colors duration-200 -mx-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#0F172A]">
                      {tx.productName}
                    </p>
                    <p className="text-xs text-slate-400">
                      TRX-{String(tx.id || "").slice(0, 6).toUpperCase()} ·{" "}
                      {dayjs(tx.createdAt).isValid()
                        ? dayjs(tx.createdAt).format("DD MMM YYYY, HH:mm")
                        : "Hari ini"} · Dicatat oleh <span className="font-semibold text-slate-600">{tx.createdByName || "Staff"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold tracking-tight text-[#0F172A]">
                      +{formatRupiah((Number(tx.sellingPrice) || 0) * (Number(tx.quantity) || 1))}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" strokeWidth={2} />
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

function CashFlowChart({
  data,
}: {
  data?: { period: string; pemasukan: number; pengeluaran: number }[];
}) {
  const width = 600;
  const height = 190;
  const paddingX = 35;
  const paddingY = 22;

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

  // Path polygon untuk gradient area fill di bawah kurva pemasukan (gaya referensi)
  const areaPath = `${pemasukanPoints} ${getX(chartData.length - 1)},${height - paddingY} ${getX(0)},${height - paddingY}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pemasukanGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
        </linearGradient>
      </defs>

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
              stroke="#F1F5F9"
              strokeWidth="1.5"
            />
            <text
              x={paddingX - 10}
              y={y + 3.5}
              textAnchor="end"
              className="fill-slate-400 text-[10px] font-sans font-medium"
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

      {/* Gradient Area Fill (Gaya gelombang modern) */}
      <polygon
        fill="url(#pemasukanGradient)"
        points={areaPath}
      />

      {/* Garis Pengeluaran (Garis Abu-abu Slate Putus-putus) */}
      <polyline
        fill="none"
        stroke="#94A3B8"
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

      {/* Titik Data Pemasukan */}
      {chartData.map((d, i) => (
        <circle
          key={`dot-${i}`}
          cx={getX(i)}
          cy={getY(d.pemasukan)}
          r="4"
          className="fill-white stroke-[#2563EB] stroke-[2.5]"
        />
      ))}
    </svg>
  );
}
