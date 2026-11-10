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
  ArrowDownLeft,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  Loader2,
  Package,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

dayjs.locale("id");

const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function TransaksiPage() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;

  const currentPeriod = dayjs().format("YYYY-MM");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: availablePeriods = [] } = trpc.transaction.getPeriods.useQuery();

  const periodOptions = useMemo(() => {
    const list = Array.from(new Set([currentPeriod, ...availablePeriods]));
    return list.sort((a, b) => b.localeCompare(a));
  }, [availablePeriods, currentPeriod]);

  const {
    data: transactions = [],
    isLoading: isTxLoading,
    error: txFetchError,
  } = trpc.transaction.getAll.useQuery(
    selectedPeriod === "ALL" ? undefined : { period: selectedPeriod }
  );

  const { data: products = [] } = trpc.product.getAllProducts.useQuery();
  const { data: accounts = [] } = trpc.account.getAllAccounts.useQuery();

  const [selectedTxDetail, setSelectedTxDetail] = useState<(typeof transactions)[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [txQuantity, setTxQuantity] = useState<number>(1);
  const [txCostPrice, setTxCostPrice] = useState<number>(0);
  const [txSellingPrice, setTxSellingPrice] = useState<number>(0);
  const [createTxError, setCreateTxError] = useState<string | null>(null);

  // Default Rekening ke akun utama / aktif
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const primary = accounts.find((a: { isPrimary: boolean; isActive: boolean; }) => a.isPrimary && a.isActive) || accounts.find((a: { isActive: boolean; }) => a.isActive);
      if (primary) setSelectedAccountId(primary.id);
    }
  }, [accounts, selectedAccountId]);

  // Mutation Tambah Transaksi
  const createTxMutation = trpc.transaction.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      resetCreateForm();
      utils.transaction.getAll.invalidate();
      utils.transaction.getPeriods.invalidate();
      utils.dashboard.getOwnerDashboard.invalidate();
      utils.dashboard.getStaffDashboard.invalidate();
      utils.product.getAllProducts.invalidate();
      utils.account.getAllAccounts.invalidate();
      utils.account.getStats.invalidate();
      utils.account.getRecentMutations.invalidate();
    },
    onError: (err) => {
      setCreateTxError(err.message);
    },
  });

  const resetCreateForm = () => {
    setSelectedProductId("");
    const primary = accounts.find((a: { isPrimary: boolean; isActive: boolean; }) => a.isPrimary && a.isActive) || accounts.find((a: { isActive: boolean; }) => a.isActive);
    setSelectedAccountId(primary ? primary.id : "");
    setTxQuantity(1);
    setTxCostPrice(0);
    setTxSellingPrice(0);
    setCreateTxError(null);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setCreateTxError(null);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setTxCostPrice(Number(prod.defaultCost) || 0);
      setTxSellingPrice(Number(prod.defaultPrice) || 0);
    }
  };

  const handleCreateTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTxError(null);

    if (!selectedProductId) {
      setCreateTxError("Silakan pilih produk yang terjual.");
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod && prod.currentStock < txQuantity) {
      setCreateTxError(
        `Stok tidak mencukupi! Sisa stok fisik produk ini: ${prod.currentStock} unit.`
      );
      return;
    }

    if (txQuantity <= 0) {
      setCreateTxError("Kuantitas transaksi harus minimal 1 unit.");
      return;
    }

    createTxMutation.mutate({
      productId: selectedProductId,
      accountId: selectedAccountId || undefined,
      period: currentPeriod,
      quantity: Number(txQuantity),
      costPrice: Number(txCostPrice) || 0,
      sellingPrice: Number(txSellingPrice) || 0,
    });
  };

  const staffList = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((tx) => {
      if (tx.createdBy) {
        map.set(tx.createdBy.id, tx.createdBy.fullName || tx.createdBy.email);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedStaffFilter !== "ALL" && tx.createdById !== selectedStaffFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchProduct = tx.product?.name?.toLowerCase().includes(query);
      const matchStaff = tx.createdBy?.fullName?.toLowerCase().includes(query);
      const matchEmail = tx.createdBy?.email?.toLowerCase().includes(query);
      const matchId = tx.id.toLowerCase().includes(query);
      return matchProduct || matchStaff || matchEmail || matchId;
    });
  }, [transactions, selectedStaffFilter, searchQuery]);

  const totalTxCount = filteredTransactions.length;
  const totalQuantitySold = filteredTransactions.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0
  );
  const totalRevenue = filteredTransactions.reduce(
    (acc, curr) =>
      acc + (curr.quantity || 0) * (Number(curr.sellingPrice) || 0),
    0
  );
  const totalProfit = filteredTransactions.reduce(
    (acc, curr) => acc + (Number(curr.totalProfit) || 0),
    0
  );
  const uniqueStaffCount = new Set(filteredTransactions.map((t) => t.createdById)).size;

  const selectedProdObj = products.find((p) => p.id === selectedProductId);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = isOwner
      ? ["ID Transaksi", "Tanggal & Waktu", "Staf Pencatat", "Email Staf", "Produk", "Kuantitas", "Harga Modal", "Harga Jual", "Total Omzet", "Total Laba"]
      : ["ID Transaksi", "Tanggal & Waktu", "Staf Pencatat", "Email Staf", "Produk", "Kuantitas", "Harga Jual", "Total Omzet"];

    const rows = filteredTransactions.map((tx) => {
      const time = dayjs(tx.createdAt).format("YYYY-MM-DD HH:mm:ss");
      const omzet = (tx.quantity || 0) * (Number(tx.sellingPrice) || 0);
      if (isOwner) {
        return [
          `"${tx.id}"`,
          `"${time}"`,
          `"${tx.createdBy?.fullName || "-"}"`,
          `"${tx.createdBy?.email || "-"}"`,
          `"${tx.product?.name || "-"}"`,
          tx.quantity,
          Number(tx.costPrice),
          Number(tx.sellingPrice),
          omzet,
          Number(tx.totalProfit),
        ];
      }
      return [
        `"${tx.id}"`,
        `"${time}"`,
        `"${tx.createdBy?.fullName || "-"}"`,
        `"${tx.createdBy?.email || "-"}"`,
        `"${tx.product?.name || "-"}"`,
        tx.quantity,
        Number(tx.sellingPrice),
        omzet,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Buku_Besar_Transaksi_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="text-sm font-medium text-[#64748B]">
          Memuat catatan transaksi...
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
              Transaksi & Kasir
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
            Catatan mutasi penjualan barang, pengeluaran kas toko, dan audit transaksi staf.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="h-9 gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Ekspor CSV
          </Button>

          <Button
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="h-9 gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 text-xs font-medium text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Transaksi Masuk
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] shadow-xs">
                <ArrowLeftRight className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {totalTxCount} Transaksi
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>
                  {totalQuantitySold > 0
                    ? `${totalQuantitySold} unit produk berhasil terjual`
                    : "Belum ada transaksi pada periode ini"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pemasukan Transaksi
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                <ArrowDownLeft className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {formatRupiah(totalRevenue)}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>
                  {totalTxCount > 0
                    ? `Akumulasi omzet dari ${totalTxCount} transaksi`
                    : "Belum ada pemasukan transaksi"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/70">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isOwner ? "Total Keuntungan Bersih" : "Staf Operator Aktif"}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
                {isOwner ? (
                  <TrendingUp className="h-4.5 w-4.5" strokeWidth={2} />
                ) : (
                  <UserCheck className="h-4.5 w-4.5" strokeWidth={2} />
                )}
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {isOwner ? formatRupiah(totalProfit) : `${uniqueStaffCount} Operator`}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>
                  {isOwner
                    ? totalRevenue > 0
                      ? `Margin laba ${((totalProfit / totalRevenue) * 100).toFixed(1)}% dari total omzet`
                      : "Belum ada laba berjalan"
                    : "Audit pencatatan harian kasir"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Aktivitas Pencatatan Transaksi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail seluruh entri penjualan yang tercatat ke sistem oleh kasir & admin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <option value="ALL">Semua periode</option>
                {periodOptions.map((p) => (
                  <option key={p} value={p}>
                    {dayjs(p).format("MMMM YYYY")} {p === currentPeriod ? "(Bulan Ini)" : ""}
                  </option>
                ))}
              </select>

              {staffList.length > 1 && (
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  <option value="ALL">Semua staf</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative w-full sm:w-60">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  size={15}
                  strokeWidth={1.8}
                />
                <Input
                  type="text"
                  placeholder="Cari transaksi / staf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border-[#E2E8F0] bg-white pl-9 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {isTxLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
              <p className="text-xs text-[#64748B]">Memuat data transaksi buku besar...</p>
            </div>
          ) : txFetchError ? (
            <div className="py-10 text-center text-xs text-[#DC2626]">
              Gagal memuat data transaksi: {txFetchError.message}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#94A3B8]">
                <ArrowLeftRight className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                {searchQuery || selectedStaffFilter !== "ALL"
                  ? "Transaksi tidak ditemukan"
                  : "Belum ada transaksi yang tercatat"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {searchQuery || selectedStaffFilter !== "ALL"
                  ? "Tidak ada transaksi yang cocok dengan kriteria pencarian atau filter yang dipilih."
                  : "Catat transaksi penjualan pertama Anda untuk mulai mengisi buku besar."}
              </p>
              {!searchQuery && selectedStaffFilter === "ALL" && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 h-9 gap-1.5 rounded-xl bg-[#2563EB] text-xs font-medium text-white hover:bg-[#1D4ED8]"
                >
                  <Plus className="h-3.5 w-3.5" /> Catat Transaksi Sekarang
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3 px-3">Waktu &amp; Tanggal</th>
                    <th className="py-3 px-3">Staf Pencatat</th>
                    <th className="py-3 px-3">Produk Terjual</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Harga Jual</th>
                    <th className="py-3 px-3 text-right">Total Transaksi</th>
                    {isOwner && (
                      <th className="py-3 px-3 text-right">Margin Laba</th>
                    )}
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filteredTransactions.map((tx) => {
                    const txTotal = (tx.quantity || 0) * (Number(tx.sellingPrice) || 0);
                    const isOwnerRecorder = tx.createdBy?.role === ROLE.OWNER;
                    const initialLetter = (tx.createdBy?.fullName || tx.createdBy?.email || "U")
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-[#F8FAFC]"
                      >
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#0F172A]">
                              {dayjs(tx.createdAt).format("DD MMM YYYY")}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] mt-0.5">
                              <Clock className="h-3 w-3 text-[#94A3B8]" />
                              {dayjs(tx.createdAt).format("HH:mm:ss")} WIB
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isOwnerRecorder
                                  ? "bg-[#172554] text-white"
                                  : "bg-[#2563EB] text-white"
                              }`}
                            >
                              {initialLetter}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[#0F172A]">
                                  {tx.createdBy?.fullName || "Tanpa Nama"}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                                    isOwnerRecorder
                                      ? "bg-[#172554]/10 text-[#172554]"
                                      : "bg-[#EFF6FF] text-[#2563EB]"
                                  }`}
                                >
                                  {tx.createdBy?.role || "STAFF"}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#94A3B8]">
                                {tx.createdBy?.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                              {tx.product?.imageLink ? (
                                <Image
                                  src={tx.product.imageLink}
                                  alt={tx.product.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#94A3B8]">
                                  <Package className="h-5 w-5" strokeWidth={1.8} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-[#0F172A]">
                                {tx.product?.name || "Produk dihapus"}
                              </p>
                              <p className="text-[11px] text-[#94A3B8]">
                                {tx.period}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#0F172A]">
                            {tx.quantity} unit
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap text-[#64748B]">
                          {formatRupiah(Number(tx.sellingPrice))}
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-[#0F172A]">
                              {formatRupiah(txTotal)}
                            </span>
                            {tx.account ? (
                              <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                <span>{tx.account.type === "CASH" ? "💵" : tx.account.type === "EWALLET" ? "📱" : "🏦"}</span>
                                <span>{tx.account.bankName}</span>
                              </span>
                            ) : (
                              <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                                💵 Kas Toko
                              </span>
                            )}
                          </div>
                        </td>

                        {isOwner && (
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-[#16A34A]">
                                +{formatRupiah(Number(tx.totalProfit))}
                              </span>
                              <span className="text-[10px] text-[#94A3B8]">
                                Modal: {formatRupiah(Number(tx.costPrice))}
                              </span>
                            </div>
                          </td>
                        )}

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTxDetail(tx);
                              setIsDetailOpen(true);
                            }}
                            className="h-8 gap-1 rounded-xl px-2.5 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F172A]">
              Rincian audit transaksi
            </DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Pemeriksaan jejak digital pencatatan transaksi kasir.
            </DialogDescription>
          </DialogHeader>

          {selectedTxDetail && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Staf pencatat transaksi
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#172554] text-xs font-bold text-white">
                    {(selectedTxDetail.createdBy?.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      {selectedTxDetail.createdBy?.fullName || "Tanpa Nama"}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTxDetail.createdBy?.email} ·{" "}
                      <span className="font-semibold text-[#2563EB]">
                        {selectedTxDetail.createdBy?.role}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Waktu dicatat:</span>
                  <span className="font-medium text-[#0F172A]">
                    {dayjs(selectedTxDetail.createdAt).format("DD MMMM YYYY, HH:mm:ss")} WIB
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Periode pembukuan:</span>
                  <span className="font-medium text-[#0F172A]">
                    {selectedTxDetail.period}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Produk:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedTxDetail.product?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Kuantitas:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedTxDetail.quantity} Unit
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-[#64748B]">Metode Pembayaran:</span>
                  <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                    {selectedTxDetail.account ? (
                      <>
                        <span>{selectedTxDetail.account.type === "CASH" ? "💵" : selectedTxDetail.account.type === "EWALLET" ? "📱" : "🏦"}</span>
                        <span>{selectedTxDetail.account.bankName} ({selectedTxDetail.account.name})</span>
                      </>
                    ) : (
                      "Kas Toko (Default)"
                    )}
                  </span>
                </div>
              </div>

              {/* Rincian Finansial */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Harga jual satuan:</span>
                  <span className="font-medium text-[#0F172A]">
                    {formatRupiah(Number(selectedTxDetail.sellingPrice))}
                  </span>
                </div>
                {isOwner && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">Harga modal satuan:</span>
                    <span className="font-medium text-[#0F172A]">
                      {formatRupiah(Number(selectedTxDetail.costPrice))}
                    </span>
                  </div>
                )}
                <div className="border-t border-[#E2E8F0] pt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#0F172A]">Total penjualan:</span>
                  <span className="font-bold text-[#2563EB]">
                    {formatRupiah(
                      (selectedTxDetail.quantity || 0) *
                        (Number(selectedTxDetail.sellingPrice) || 0)
                    )}
                  </span>
                </div>
                {isOwner && (
                  <div className="flex items-center justify-between text-xs text-[#16A34A] font-medium pt-1">
                    <span>Keuntungan bersih (profit):</span>
                    <span>+{formatRupiah(Number(selectedTxDetail.totalProfit))}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="w-full rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Tutup Rincian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
          <form onSubmit={handleCreateTxSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#0F172A]">
                Catat Transaksi Penjualan
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                Pilih produk dan tentukan jumlah unit yang terjual.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {createTxError && (
                <div className="rounded-xl bg-[#FEF2F2] p-3 text-xs text-[#DC2626] border border-[#FECACA]">
                  {createTxError}
                </div>
              )}

              {/* Pilih Produk */}
              <div className="space-y-2">
                <Label htmlFor="tx-product" className="text-xs font-semibold text-[#0F172A]">
                  Produk
                </Label>
                <select
                  id="tx-product"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  <option value="">-- Pilih Produk Master --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tx-qty" className="text-xs font-semibold text-[#0F172A]">
                    Jumlah (Qty)
                  </Label>
                  <Input
                    id="tx-qty"
                    type="number"
                    min="1"
                    max={selectedProdObj ? selectedProdObj.currentStock : undefined}
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tx-price" className="text-xs font-semibold text-[#0F172A]">
                    Harga Jual Satuan
                  </Label>
                  <Input
                    id="tx-price"
                    type="number"
                    min="0"
                    value={txSellingPrice}
                    onChange={(e) => setTxSellingPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Metode Pembayaran / Masuk ke Rekening */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tx-account" className="text-xs font-semibold text-[#0F172A]">
                    Metode Pembayaran (Rekening Masuk)
                  </Label>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Saldo Otomatis Bertambah
                  </span>
                </div>
                <select
                  id="tx-account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  {accounts.filter((a) => a.isActive).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === "CASH"
                        ? `💵 ${acc.name} (${acc.bankName})`
                        : acc.type === "EWALLET"
                        ? `📱 ${acc.name} (${acc.bankName})`
                        : `🏦 ${acc.bankName} - ${acc.name}`} — Saldo: {formatRupiah(acc.balance)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#64748B]">
                  Hasil penjualan sebesar {formatRupiah(txQuantity * txSellingPrice)} akan langsung masuk ke rekening di atas.
                </p>
              </div>

              {/* Box Preview Total */}
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 text-xs text-[#64748B] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Total Penjualan:</span>
                  <span className="font-semibold text-[#0F172A] text-sm">
                    {formatRupiah(txQuantity * txSellingPrice)}
                  </span>
                </div>
                {isOwner && (
                  <div className="flex justify-between items-center text-[#16A34A] pt-1 border-t border-[#E2E8F0]">
                    <span>Estimasi Laba Bersih:</span>
                    <span className="font-medium">
                      +{formatRupiah(txQuantity * (txSellingPrice - txCostPrice))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-10 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createTxMutation.isPending}
                className="h-10 rounded-xl bg-[#2563EB] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8]"
              >
                {createTxMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Transaksi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
