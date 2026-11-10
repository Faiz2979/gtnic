"use client";

import { trpc } from "@/client/trpc";
import { AccessDeniedCard } from "@/components/access-denied";
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
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

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

export default function TagihanPage() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isProfileLoading } =
    trpc.user.getCurrentProfile.useQuery();
  const isOwner = profile?.role === ROLE.OWNER;

  // 2. Data Rekening Bank & Kas (untuk tujuan pelunasan)
  const { data: accounts = [] } = trpc.account.getAllAccounts.useQuery(undefined, {
    enabled: isOwner,
  });

  // 3. Query Tagihan & Statistik
  const {
    data: bills = [],
    isLoading: isBillsLoading,
    refetch: refetchBills,
  } = trpc.bill.getAllBills.useQuery(undefined, {
    enabled: isOwner,
  });

  const { data: stats, isLoading: isStatsLoading } = trpc.bill.getStats.useQuery(undefined, {
    enabled: isOwner,
  });

  // 4. State Filter & Search
  const [activeTab, setActiveTab] = useState<"ALL" | "RECEIVABLE" | "PAYABLE">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // 5. State Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // 6. State Modal Buat Tagihan
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "RECEIVABLE" as "RECEIVABLE" | "PAYABLE",
    title: "",
    contactName: "",
    contactPhone: "",
    dueDate: dayjs().add(7, "day").format("YYYY-MM-DD"),
    notes: "",
    items: [{ name: "", quantity: 1, price: 0 }],
  });

  // 7. State Modal Catat Pembayaran
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<(typeof bills)[0] | null>(null);
  const [payForm, setPayForm] = useState({
    accountId: "",
    amount: 0,
    paymentDate: dayjs().format("YYYY-MM-DD"),
    notes: "",
  });

  // 8. State Modal Preview Invoice
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewBill, setPreviewBill] = useState<(typeof bills)[0] | null>(null);

  // 9. State Modal Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<{ id: string; invoiceNumber: string } | null>(null);

  // Mutations
  const createBillMutation = trpc.bill.createBill.useMutation({
    onSuccess: (data) => {
      utils.bill.getAllBills.invalidate();
      utils.bill.getStats.invalidate();
      setIsCreateModalOpen(false);
      setCreateForm({
        type: "RECEIVABLE",
        title: "",
        contactName: "",
        contactPhone: "",
        dueDate: dayjs().add(7, "day").format("YYYY-MM-DD"),
        notes: "",
        items: [{ name: "", quantity: 1, price: 0 }],
      });
      showToast(`Tagihan ${data.invoiceNumber} berhasil dibuat!`);
    },
    onError: (err) => {
      alert(err.message || "Gagal membuat tagihan.");
    },
  });

  const recordPaymentMutation = trpc.bill.recordPayment.useMutation({
    onSuccess: () => {
      utils.bill.getAllBills.invalidate();
      utils.bill.getStats.invalidate();
      utils.account.getAllAccounts.invalidate();
      utils.account.getStats.invalidate();
      utils.account.getRecentMutations.invalidate();
      setIsPayModalOpen(false);
      setSelectedBillForPay(null);
      showToast("Pembayaran berhasil dicatat & saldo rekening terupdate!");
    },
    onError: (err) => {
      alert(err.message || "Gagal mencatat pembayaran.");
    },
  });

  const deleteBillMutation = trpc.bill.deleteBill.useMutation({
    onSuccess: () => {
      utils.bill.getAllBills.invalidate();
      utils.bill.getStats.invalidate();
      setIsDeleteModalOpen(false);
      setBillToDelete(null);
      showToast("Tagihan berhasil dihapus.");
    },
    onError: (err) => {
      alert(err.message || "Gagal menghapus tagihan.");
    },
  });

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchType = activeTab === "ALL" || b.type === activeTab;
      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.contactName.toLowerCase().includes(q) ||
        (b.contactPhone && b.contactPhone.includes(q));

      return matchType && matchStatus && matchSearch;
    });
  }, [bills, activeTab, statusFilter, searchQuery]);

  // Handle WhatsApp Reminder Copy
  const handleCopyWhatsApp = (bill: (typeof bills)[0]) => {
    const isReceivable = bill.type === "RECEIVABLE";
    const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0];

    const message = isReceivable
      ? `Halo Yth. ${bill.contactName},\n\nKami menginformasikan tagihan Anda untuk: *${bill.title}* (${bill.invoiceNumber}).\nTotal Tagihan: *${formatRupiah(bill.totalAmount)}*\nSisa yang belum dibayar: *${formatRupiah(bill.remainingAmount)}*\nJatuh Tempo: *${dayjs(bill.dueDate).format("DD MMMM YYYY")}*.\n\nPembayaran dapat ditransfer ke:\n🏦 ${primaryAccount ? `${primaryAccount.bankName} - ${primaryAccount.accountNumber} a/n ${primaryAccount.holderName}` : "Rekening Toko"}\n\nTerima kasih atas kerja samanya!`
      : `Pengingat Tagihan Pembelian: ${bill.title} (${bill.invoiceNumber}) ke ${bill.contactName} sebesar ${formatRupiah(bill.remainingAmount)} sebelum ${dayjs(bill.dueDate).format("DD MMMM YYYY")}.`;

    navigator.clipboard.writeText(message);
    showToast("Format pesan tagihan WhatsApp berhasil disalin!");
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
    return <AccessDeniedCard pageName="Tagihan & Faktur Usaha" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#172554] px-4 py-3 text-sm font-medium text-white shadow-xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Tagihan & Faktur
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-900 text-white">
              <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Owner
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Jadwal piutang pelanggan, pembayaran utang belanja supplier, dan status tempo faktur.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-8.5 gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 text-xs font-medium text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Tagihan
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              refetchBills();
              showToast("Memperbarui data tagihan...");
            }}
            title="Refresh Data"
            className="h-8.5 w-8.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 4 Finara Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Piutang Pelanggan */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Piutang Belum Tertagih
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] shadow-2xs">
                <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {isStatsLoading ? "Memuat..." : formatRupiah(stats?.totalReceivablesUnpaid ?? 0)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tagihan ke pelanggan yang belum lunas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Utang Supplier & Beban */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Utang Harus Dibayar
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {isStatsLoading ? "Memuat..." : formatRupiah(stats?.totalPayablesUnpaid ?? 0)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Belanja modal &amp; beban operasional
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tagihan Jatuh Tempo */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Lewat Jatuh Tempo
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <AlertCircle className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-amber-600">
                {isStatsLoading ? "Memuat..." : `${stats?.overdueCount ?? 0} Tagihan`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Memerlukan tindak lanjut penagihan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tagihan Lunas */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Tagihan Lunas
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {isStatsLoading ? "Memuat..." : `${stats?.paidThisMonthCount ?? 0} Faktur`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Riwayat pembayaran sukses tercatat
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Table Section */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-100 px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "ALL"
                ? "border-[#172554] text-[#172554]"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <ReceiptText className="h-4 w-4" />
              Semua ({bills.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RECEIVABLE")}
              className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "RECEIVABLE"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <ArrowDownLeft className="h-4 w-4 text-blue-600" />
              Piutang Pelanggan ({bills.filter((b) => b.type === "RECEIVABLE").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PAYABLE")}
              className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "PAYABLE"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              Utang Supplier & Beban ({bills.filter((b) => b.type === "PAYABLE").length})
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2 pb-3">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari invoice / nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl border-slate-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Dibayar</option>
              <option value="PARTIAL">Dicicil (Sebagian)</option>
              <option value="OVERDUE">Jatuh Tempo</option>
              <option value="PAID">Lunas</option>
            </select>
          </div>
        </div>

        {/* Table of Bills */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0F172A]">
            <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-[#64748B] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Invoice & Tipe</th>
                <th className="px-6 py-3.5">Perihal & Kontak</th>
                <th className="px-6 py-3.5">Jatuh Tempo</th>
                <th className="px-6 py-3.5 text-right">Total Tagihan</th>
                <th className="px-6 py-3.5 text-right">Sisa Tagihan</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isBillsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Memuat daftar tagihan...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Tidak ada tagihan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const isReceivable = bill.type === "RECEIVABLE";
                  const isPaid = bill.status === "PAID";
                  const isOverdue = bill.status === "OVERDUE" || (!isPaid && dayjs(bill.dueDate).isBefore(dayjs(), "day"));

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* No. Invoice */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-[#0F172A]">
                          {bill.invoiceNumber}
                        </div>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isReceivable
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                        >
                          {isReceivable ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {isReceivable ? "Piutang Pelanggan" : "Utang Supplier"}
                        </span>
                      </td>

                      {/* Perihal & Kontak */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-xs text-[#0F172A] max-w-xs truncate">
                          {bill.title}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {bill.contactName}
                          {bill.contactPhone && (
                            <span className="text-slate-400 font-mono ml-1.5 text-[11px]">
                              ({bill.contactPhone})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jatuh Tempo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {dayjs(bill.dueDate).format("DD MMM YYYY")}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isPaid ? (
                            <span className="text-emerald-600 font-medium">Selesai</span>
                          ) : isOverdue ? (
                            <span className="text-red-600 font-semibold">Lewat jatuh tempo</span>
                          ) : (
                            <span>Sisa {dayjs(bill.dueDate).diff(dayjs(), "day")} hari lagi</span>
                          )}
                        </div>
                      </td>

                      {/* Total Tagihan */}
                      <td className="px-6 py-4 text-right font-medium text-xs text-slate-600">
                        {formatRupiah(bill.totalAmount)}
                      </td>

                      {/* Sisa Tagihan */}
                      <td className="px-6 py-4 text-right font-bold text-xs">
                        <span className={bill.remainingAmount > 0 ? "text-red-600" : "text-emerald-600"}>
                          {formatRupiah(bill.remainingAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${bill.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : bill.status === "PARTIAL"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : isOverdue
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                        >
                          {bill.status === "PAID"
                            ? "Lunas"
                            : bill.status === "PARTIAL"
                              ? "Sebagian"
                              : isOverdue
                                ? "Jatuh Tempo"
                                : "Belum Bayar"}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Catat Pembayaran */}
                          {!isPaid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBillForPay(bill);
                                setPayForm({
                                  accountId: accounts[0]?.id || "",
                                  amount: bill.remainingAmount,
                                  paymentDate: dayjs().format("YYYY-MM-DD"),
                                  notes: "",
                                });
                                setIsPayModalOpen(true);
                              }}
                              className="h-8 rounded-lg text-xs font-medium text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100"
                            >
                              Bayar
                            </Button>
                          )}

                          {/* Preview / Cetak Invoice */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPreviewBill(bill);
                              setIsPreviewModalOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800"
                            title="Pratinjau / Cetak Invoice"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Tombol Kirim WhatsApp */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyWhatsApp(bill)}
                            className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Salin Pesan Tagihan WhatsApp"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>

                          {/* Hapus Tagihan (Owner only) */}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setBillToDelete({ id: bill.id, invoiceNumber: bill.invoiceNumber });
                                setIsDeleteModalOpen(true);
                              }}
                              className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Hapus Tagihan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Buat Tagihan Baru */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-[#2563EB]" />
              Buat Tagihan / Faktur Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Catat tagihan piutang penjualan ke pelanggan atau utang belanja ke supplier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Pilihan Tipe: Piutang vs Utang */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, type: "RECEIVABLE" })}
                className={`rounded-xl border p-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${createForm.type === "RECEIVABLE"
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                Piutang Pelanggan
              </button>

              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, type: "PAYABLE" })}
                className={`rounded-xl border p-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${createForm.type === "PAYABLE"
                  ? "border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <ArrowUpRight className="h-4 w-4 text-purple-600" />
                Utang Supplier & Beban
              </button>
            </div>

            {/* Perihal Tagihan */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">Perihal / Judul Tagihan *</Label>
              <Input
                placeholder="Contoh: Pesanan Katering Event PT ABC / Belanja Ayam Fresh"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 text-xs"
              />
            </div>

            {/* Nama & Kontak */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  {createForm.type === "RECEIVABLE" ? "Nama Pelanggan *" : "Nama Supplier / Vendor *"}
                </Label>
                <Input
                  placeholder="Contoh: PT Sinar Abadi / Bu Siti"
                  value={createForm.contactName}
                  onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">No. WhatsApp / HP</Label>
                <Input
                  placeholder="Contoh: 081298765432"
                  value={createForm.contactPhone}
                  onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Tanggal Jatuh Tempo */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">Tanggal Jatuh Tempo *</Label>
              <Input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 text-xs"
              />
            </div>

            {/* Rincian Item Tagihan */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-slate-700">Rincian Item & Harga *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCreateForm({
                      ...createForm,
                      items: [...createForm.items, { name: "", quantity: 1, price: 0 }],
                    })
                  }
                  className="h-7 text-xs text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  <Plus className="mr-1 h-3 w-3" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {createForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Nama Barang / Jasa"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[idx].name = e.target.value;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      className="flex-1 rounded-xl border-slate-200 text-xs"
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[idx].quantity = Number(e.target.value) || 1;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      className="w-16 rounded-xl border-slate-200 text-xs text-center"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Harga"
                      value={item.price || ""}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[idx].price = Number(e.target.value) || 0;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      className="w-28 rounded-xl border-slate-200 text-xs font-medium text-right"
                    />
                    {createForm.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newItems = createForm.items.filter((_, i) => i !== idx);
                          setCreateForm({ ...createForm, items: newItems });
                        }}
                        className="h-9 w-9 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Preview */}
              <div className="mt-2 text-right text-xs font-bold text-slate-800">
                Total Nilai:{" "}
                <span className="text-base text-[#2563EB]">
                  {formatRupiah(
                    createForm.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                  )}
                </span>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">Catatan / Termin Pembayaran</Label>
              <Input
                placeholder="Contoh: Pembayaran transfer BCA toko a/n PT GTNIC"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border-slate-200 text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!createForm.title || !createForm.contactName) {
                  alert("Mohon lengkapi judul tagihan dan nama kontak.");
                  return;
                }
                const hasEmptyItem = createForm.items.some((i) => !i.name || i.price <= 0);
                if (hasEmptyItem) {
                  alert("Pastikan seluruh item memiliki nama dan harga lebih dari 0.");
                  return;
                }
                createBillMutation.mutate(createForm);
              }}
              disabled={createBillMutation.isPending}
              className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium"
            >
              {createBillMutation.isPending ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Catat Pembayaran / Pelunasan */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Catat Pembayaran Tagihan
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Saldo rekening yang dipilih akan otomatis bertambah (untuk piutang) atau berkurang (untuk utang).
            </DialogDescription>
          </DialogHeader>

          {selectedBillForPay && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBillForPay.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Perihal:</span>
                  <span className="font-medium text-slate-800">{selectedBillForPay.title}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Sisa Tagihan:</span>
                  <span className="font-bold text-red-600">{formatRupiah(selectedBillForPay.remainingAmount)}</span>
                </div>
              </div>

              {/* Rekening Tujuan */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  {selectedBillForPay.type === "RECEIVABLE"
                    ? "Pilih Rekening Tujuan (Uang Masuk)"
                    : "Pilih Rekening Sumber (Uang Keluar)"}
                </Label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none"
                  value={payForm.accountId}
                  onChange={(e) => setPayForm({ ...payForm, accountId: e.target.value })}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === "CASH" ? "💵 Kas Tunai (Laci)" : `🏦 ${acc.bankName} - ${acc.name}`} — Saldo: {formatRupiah(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal Pembayaran */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nominal Pembayaran (Rp) *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedBillForPay.remainingAmount}
                  value={payForm.amount || ""}
                  onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) || 0 })}
                  className="mt-1.5 rounded-xl border-slate-200 text-xs font-semibold"
                />
                <span className="mt-1 text-[11px] text-slate-400">
                  Terbaca: {formatRupiah(payForm.amount)}
                </span>
              </div>

              {/* Tanggal Pembayaran */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Tanggal Pembayaran</Label>
                <Input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200 text-xs"
                />
              </div>

              {/* Catatan / No Referensi */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Catatan Bukti / No. Ref</Label>
                <Input
                  placeholder="Contoh: Transfer m-banking BCA ref: 98129281"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPayModalOpen(false)}
              className="rounded-xl border-slate-200 text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!selectedBillForPay) return;
                if (!payForm.accountId) {
                  alert("Pilih rekening pembayaran.");
                  return;
                }
                if (payForm.amount <= 0) {
                  alert("Nominal pembayaran harus lebih dari 0.");
                  return;
                }
                recordPaymentMutation.mutate({
                  billId: selectedBillForPay.id,
                  accountId: payForm.accountId,
                  amount: payForm.amount,
                  paymentDate: payForm.paymentDate,
                  notes: payForm.notes,
                });
              }}
              disabled={recordPaymentMutation.isPending}
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium"
            >
              {recordPaymentMutation.isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Preview Invoice Digital */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
          {previewBill && (
            <div className="space-y-4 text-xs text-[#0F172A]" id="printable-invoice">
              {/* Header Invoice */}
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold tracking-tight text-[#172554]">
                    FAKTUR / INVOICE RESMI
                  </div>
                  <div className="font-mono text-slate-500 font-medium">
                    {previewBill.invoiceNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${previewBill.status === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {previewBill.status === "PAID" ? "LUNAS (PAID)" : "BELUM LUNAS"}
                  </span>
                </div>
              </div>

              {/* Rincian Kontak */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 uppercase font-semibold">Ditujukan Kepada:</div>
                  <div className="font-bold text-slate-800 mt-0.5">{previewBill.contactName}</div>
                  {previewBill.contactPhone && <div className="text-slate-500">{previewBill.contactPhone}</div>}
                </div>
                <div className="text-right">
                  <div className="text-slate-400 uppercase font-semibold">Jatuh Tempo:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {dayjs(previewBill.dueDate).format("DD MMMM YYYY")}
                  </div>
                </div>
              </div>

              {/* Item List Table */}
              <div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Harga</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewBill.items.map((item: { name: string; quantity: number; price: number }, i: number) => (
                      <tr key={i}>
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-center text-slate-500">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-500">{formatRupiah(item.price)}</td>
                        <td className="py-2 text-right font-semibold">{formatRupiah(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Riwayat Bayar */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-bold text-sm">{formatRupiah(previewBill.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Sudah Dibayar:</span>
                  <span>{formatRupiah(previewBill.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold border-t border-slate-100 pt-1.5">
                  <span>Sisa yang Harus Dibayar:</span>
                  <span>{formatRupiah(previewBill.remainingAmount)}</span>
                </div>
              </div>

              {/* Footer info transfer rekening */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-[11px] text-blue-900">
                <div className="font-semibold flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Rekening Pembayaran Toko:
                </div>
                <div className="mt-1 text-slate-700">
                  {accounts.find((a) => a.isPrimary) ? (
                    <div>
                      {accounts.find((a) => a.isPrimary)?.bankName} —{" "}
                      <span className="font-mono font-bold">
                        {accounts.find((a) => a.isPrimary)?.accountNumber}
                      </span>{" "}
                      (a/n {accounts.find((a) => a.isPrimary)?.holderName})
                    </div>
                  ) : (
                    <div>BCA / Kas Tunai Toko</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewModalOpen(false)}
              className="rounded-xl border-slate-200 text-xs"
            >
              Tutup
            </Button>
            <Button
              onClick={() => window.print()}
              className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Cetak / Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Konfirmasi Hapus Tagihan */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Hapus Tagihan?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-2">
              Apakah Anda yakin ingin menghapus tagihan nomor{" "}
              <strong className="text-slate-900">{billToDelete?.invoiceNumber}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl border-slate-200 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (billToDelete) {
                  deleteBillMutation.mutate({ id: billToDelete.id });
                }
              }}
              disabled={deleteBillMutation.isPending}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
            >
              {deleteBillMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

