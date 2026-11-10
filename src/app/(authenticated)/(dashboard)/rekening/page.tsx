"use client";

import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Wallet,
    Landmark,
    Banknote,
    CreditCard,
    Plus,
    Search,
    ShieldCheck,
    UserCheck,
    Copy,
    Check,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    Edit,
    Trash2,
    Sparkles,
    QrCode,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    History,
    TrendingUp,
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

// Preset Bank & E-Wallet Populer
const POPULAR_BANKS = [
    { name: "BCA", type: "BANK", label: "Bank Central Asia" },
    { name: "Mandiri", type: "BANK", label: "Bank Mandiri" },
    { name: "BRI", type: "BANK", label: "Bank Rakyat Indonesia" },
    { name: "BNI", type: "BANK", label: "Bank Negara Indonesia" },
    { name: "BSI", type: "BANK", label: "Bank Syariah Indonesia" },
    { name: "Bank Jago", type: "BANK", label: "Bank Jago" },
    { name: "SeaBank", type: "BANK", label: "SeaBank Indonesia" },
    { name: "Kas Tunai", type: "CASH", label: "Kas Tunai Toko / Fisik" },
    { name: "QRIS / GoPay", type: "EWALLET", label: "QRIS / GoPay Merchant" },
    { name: "DANA", type: "EWALLET", label: "DANA Bisnis" },
    { name: "OVO", type: "EWALLET", label: "OVO Merchant" },
    { name: "Lainnya", type: "BANK", label: "Bank / Rekening Lainnya" },
];

export default function RekeningPage() {
    const utils = trpc.useUtils();

    // 1. Data Profil Pengguna Aktif
    const { data: profile, isLoading: isProfileLoading } =
        trpc.user.getCurrentProfile.useQuery();
    const isOwner = profile?.role === ROLE.OWNER;
    const userName = profile?.fullName?.split(" ")[0] || "Pengguna";

    // 2. Data Rekening & Mutasi dari tRPC
    const {
        data: accounts = [],
        isLoading: isAccountsLoading,
        refetch: refetchAccounts,
    } = trpc.account.getAllAccounts.useQuery();

    const { data: stats, isLoading: isStatsLoading } =
        trpc.account.getStats.useQuery();

    const {
        data: recentMutations = [],
        isLoading: isMutationsLoading,
        refetch: refetchMutations,
    } = trpc.account.getRecentMutations.useQuery({ limit: 30 });

    // 3. State Tabs & Search/Filter
    const [activeTab, setActiveTab] = useState<"accounts" | "mutations">("accounts");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"ALL" | "BANK" | "EWALLET" | "CASH">("ALL");

    // 4. State Toast / Copy feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 2800);
    };

    const handleCopyAccountNumber = (accountNumber: string, id: string) => {
        navigator.clipboard.writeText(accountNumber);
        setCopiedId(id);
        showToast(`Nomor rekening ${accountNumber} berhasil disalin!`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // 5. State Modal Tambah Rekening
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: "",
        bankName: "BCA",
        accountNumber: "",
        holderName: "",
        type: "BANK" as "BANK" | "EWALLET" | "CASH",
        balance: 0,
        isActive: true,
        isPrimary: false,
        notes: "",
    });

    // 6. State Modal Edit Rekening
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<{
        id: string;
        name: string;
        bankName: string;
        accountNumber: string;
        holderName: string;
        type: "BANK" | "EWALLET" | "CASH";
        isActive: boolean;
        isPrimary: boolean;
        notes: string;
    } | null>(null);

    // 7. State Modal Penyesuaian Saldo / Mutasi Kas
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        accountId: "",
        type: "INCOME" as "INCOME" | "EXPENSE" | "ADJUSTMENT",
        amount: 0,
        description: "",
        reference: "",
    });

    // 8. State Modal Hapus
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

    // tRPC Mutations
    const createAccountMutation = trpc.account.createAccount.useMutation({
        onSuccess: () => {
            utils.account.getAllAccounts.invalidate();
            utils.account.getStats.invalidate();
            utils.account.getRecentMutations.invalidate();
            setIsAddModalOpen(false);
            setAddForm({
                name: "",
                bankName: "BCA",
                accountNumber: "",
                holderName: "",
                type: "BANK",
                balance: 0,
                isActive: true,
                isPrimary: false,
                notes: "",
            });
            showToast("Rekening baru berhasil ditambahkan!");
        },
        onError: (err) => {
            alert(err.message || "Gagal menambahkan rekening baru.");
        },
    });

    const updateAccountMutation = trpc.account.updateAccount.useMutation({
        onSuccess: () => {
            utils.account.getAllAccounts.invalidate();
            utils.account.getStats.invalidate();
            setIsEditModalOpen(false);
            setEditForm(null);
            showToast("Data rekening berhasil diperbarui!");
        },
        onError: (err) => {
            alert(err.message || "Gagal memperbarui rekening.");
        },
    });

    const deleteAccountMutation = trpc.account.deleteAccount.useMutation({
        onSuccess: () => {
            utils.account.getAllAccounts.invalidate();
            utils.account.getStats.invalidate();
            utils.account.getRecentMutations.invalidate();
            setIsDeleteModalOpen(false);
            setAccountToDelete(null);
            showToast("Rekening berhasil dihapus.");
        },
        onError: (err) => {
            alert(err.message || "Gagal menghapus rekening.");
        },
    });

    const adjustBalanceMutation = trpc.account.adjustBalance.useMutation({
        onSuccess: () => {
            utils.account.getAllAccounts.invalidate();
            utils.account.getStats.invalidate();
            utils.account.getRecentMutations.invalidate();
            setIsAdjustModalOpen(false);
            setAdjustForm({
                accountId: "",
                type: "INCOME",
                amount: 0,
                description: "",
                reference: "",
            });
            showToast("Penyesuaian saldo berhasil dicatat!");
        },
        onError: (err) => {
            alert(err.message || "Gagal mencatat mutasi rekening.");
        },
    });

    // Filter accounts
    const filteredAccounts = useMemo(() => {
        return accounts.filter((acc) => {
            const matchType = filterType === "ALL" || acc.type === filterType;
            const q = searchQuery.toLowerCase().trim();
            const matchQuery =
                !q ||
                acc.name.toLowerCase().includes(q) ||
                acc.bankName.toLowerCase().includes(q) ||
                acc.accountNumber.toLowerCase().includes(q) ||
                acc.holderName.toLowerCase().includes(q);
            return matchType && matchQuery;
        });
    }, [accounts, filterType, searchQuery]);

    // Card theme generator based on bank name and type
    const getCardTheme = (bankName: string, type: string) => {
        const b = bankName.toUpperCase();
        if (type === "CASH") {
            return {
                bg: "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900",
                border: "border-emerald-500/30",
                accent: "text-emerald-400",
                glow: "shadow-emerald-950/20",
                tag: "KAS TUNAI",
            };
        }
        if (b.includes("BCA")) {
            return {
                bg: "bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#0f172a]",
                border: "border-blue-500/30",
                accent: "text-blue-300",
                glow: "shadow-blue-950/20",
                tag: "BCA",
            };
        }
        if (b.includes("MANDIRI")) {
            return {
                bg: "bg-gradient-to-br from-[#0f2d59] via-[#1b4372] to-[#091b36]",
                border: "border-amber-500/30",
                accent: "text-amber-300",
                glow: "shadow-blue-950/20",
                tag: "MANDIRI",
            };
        }
        if (b.includes("BRI")) {
            return {
                bg: "bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#082f49]",
                border: "border-sky-400/30",
                accent: "text-sky-300",
                glow: "shadow-sky-950/20",
                tag: "BRI",
            };
        }
        if (b.includes("QRIS") || b.includes("GOPAY") || type === "EWALLET") {
            return {
                bg: "bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#1e1b4b]",
                border: "border-indigo-400/30",
                accent: "text-indigo-300",
                glow: "shadow-indigo-950/20",
                tag: "E-WALLET / QRIS",
            };
        }
        return {
            bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950",
            border: "border-slate-600/30",
            accent: "text-slate-300",
            glow: "shadow-slate-950/20",
            tag: bankName.toUpperCase(),
        };
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
                            Rekening & Kas
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
                        Kelola akun bank, e-wallet, dan kas tunai fisik operasional usaha Anda secara transparan.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {isOwner && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (accounts.length > 0) {
                                        setAdjustForm({
                                            accountId: accounts[0].id,
                                            type: "INCOME",
                                            amount: 0,
                                            description: "",
                                            reference: "",
                                        });
                                    }
                                    setIsAdjustModalOpen(true);
                                }}
                                className="rounded-xl border-slate-200 bg-white text-[#0F172A] hover:bg-slate-50 font-medium shadow-sm transition-all text-xs sm:text-sm h-10 px-4"
                            >
                                <ArrowDownLeft className="mr-1.5 h-4 w-4 text-emerald-600" />
                                Catat Mutasi / Kas
                            </Button>

                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 font-medium shadow-sm transition-all text-xs sm:text-sm h-10 px-4"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Tambah Rekening
                            </Button>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            refetchAccounts();
                            refetchMutations();
                            showToast("Memperbarui data rekening...");
                        }}
                        title="Refresh Data"
                        className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 4 Finara Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Likuiditas / Saldo Keseluruhan */}
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#64748B]">
                                Total Saldo Keseluruhan
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172554]/10 text-[#172554]">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                                {isStatsLoading ? (
                                    <span className="text-slate-300">Memuat...</span>
                                ) : (
                                    formatRupiah(stats?.totalBalance ?? 0)
                                )}
                            </div>
                            <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Akumulasi seluruh rekening aktif
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Saldo Bank */}
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#64748B]">
                                Saldo Rekening Bank
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Landmark className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                                {isStatsLoading ? (
                                    <span className="text-slate-300">Memuat...</span>
                                ) : (
                                    formatRupiah(stats?.totalBankBalance ?? 0)
                                )}
                            </div>
                            <p className="mt-1 text-xs text-[#64748B]">
                                Tersimpan di perbankan resmi
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Kas Tunai Fisik */}
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#64748B]">
                                Kas Fisik di Toko
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Banknote className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                                {isStatsLoading ? (
                                    <span className="text-slate-300">Memuat...</span>
                                ) : (
                                    formatRupiah(stats?.totalCashBalance ?? 0)
                                )}
                            </div>
                            <p className="mt-1 text-xs text-[#64748B]">
                                Uang tunai siap pakai di laci kasir
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* QRIS / E-Wallet & Total Akun */}
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#64748B]">
                                E-Wallet & QRIS
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                                {isStatsLoading ? (
                                    <span className="text-slate-300">Memuat...</span>
                                ) : (
                                    formatRupiah(stats?.totalEwalletBalance ?? 0)
                                )}
                            </div>
                            <p className="mt-1 text-xs text-[#64748B]">
                                {stats?.activeAccountsCount ?? accounts.length} akun aktif terdaftar
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Fintech Cards Grid */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-[#2563EB]" />
                            Kartu Finansial & Kas Aktif
                        </h2>
                        <p className="text-xs text-[#64748B]">
                            Klik salin pada nomor rekening untuk memberikan informasi pembayaran ke pelanggan.
                        </p>
                    </div>
                </div>

                {isAccountsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-48 rounded-2xl bg-slate-200 animate-pulse"
                            />
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <Wallet className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-3 text-base font-semibold text-slate-800">
                            Belum Ada Rekening Terdaftar
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                            Tambahkan rekening bank atau kas tunai pertama Anda untuk mempermudah pencatatan saldo dan transaksi.
                        </p>
                        {isOwner && (
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-4 rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Tambah Rekening Sekarang
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map((acc) => {
                            const theme = getCardTheme(acc.bankName, acc.type);
                            const isCopied = copiedId === acc.id;

                            return (
                                <div
                                    key={acc.id}
                                    className={`relative overflow-hidden rounded-2xl ${theme.bg} p-5 text-white shadow-lg ${theme.glow} border ${theme.border} transition-all duration-200 hover:-translate-y-0.5`}
                                >
                                    {/* Subtle Background Pattern */}
                                    <div className="absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                                    <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/5 blur-xl pointer-events-none" />

                                    {/* Top Bar of Card: Bank Name & Status */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm text-white">
                                                {acc.type === "CASH" ? (
                                                    <Banknote className="h-4 w-4" />
                                                ) : acc.type === "EWALLET" ? (
                                                    <QrCode className="h-4 w-4" />
                                                ) : (
                                                    <Landmark className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold tracking-wide text-sm">
                                                    {acc.bankName}
                                                </span>
                                                <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                                                    {theme.tag}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {acc.isPrimary && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                                                    <Sparkles className="h-2.5 w-2.5" /> Utama
                                                </span>
                                            )}
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${acc.isActive
                                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                                                    }`}
                                            >
                                                {acc.isActive ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle of Card: Account Number & Copy */}
                                    <div className="mt-5 relative z-10">
                                        <div className="text-[11px] text-white/60 font-medium">
                                            {acc.name}
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <div className="font-mono text-base tracking-wider font-semibold text-white/95">
                                                {acc.accountNumber}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyAccountNumber(acc.accountNumber, acc.id)}
                                                className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/80 hover:bg-white/20 transition-colors"
                                                title="Salin Nomor Rekening"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-400" />
                                                        <span className="text-emerald-300">Tersalin</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>Salin</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom of Card: Holder & Balance */}
                                    <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-3 relative z-10">
                                        <div>
                                            <div className="text-[10px] uppercase text-white/50 tracking-wider">
                                                Atas Nama
                                            </div>
                                            <div className="text-xs font-semibold text-white/90 truncate max-w-[160px]">
                                                {acc.holderName}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase text-white/50 tracking-wider">
                                                Saldo Berjalan
                                            </div>
                                            <div className="text-base font-bold text-white tracking-tight">
                                                {formatRupiah(acc.balance)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Action footer (Owner only) */}
                                    {isOwner && (
                                        <div className="mt-3 flex items-center justify-end gap-1.5 pt-2 border-t border-white/5 relative z-10">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAdjustForm({
                                                        accountId: acc.id,
                                                        type: "INCOME",
                                                        amount: 0,
                                                        description: "",
                                                        reference: "",
                                                    });
                                                    setIsAdjustModalOpen(true);
                                                }}
                                                className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white transition-colors"
                                            >
                                                Sesuaikan Saldo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditForm({
                                                        id: acc.id,
                                                        name: acc.name,
                                                        bankName: acc.bankName,
                                                        accountNumber: acc.accountNumber,
                                                        holderName: acc.holderName,
                                                        type: acc.type as "BANK" | "EWALLET" | "CASH",
                                                        isActive: acc.isActive,
                                                        isPrimary: acc.isPrimary,
                                                        notes: acc.notes || "",
                                                    });
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="rounded-lg bg-white/10 hover:bg-white/20 p-1 text-white transition-colors"
                                                title="Edit Rekening"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            {!acc.isPrimary && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAccountToDelete({ id: acc.id, name: acc.name });
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="rounded-lg bg-red-500/20 hover:bg-red-500/30 p-1 text-red-200 transition-colors"
                                                    title="Hapus Rekening"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tabs & Table Section */}
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
                {/* Navigation Tabs Header */}
                <div className="border-b border-slate-100 px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("accounts")}
                            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "accounts"
                                    ? "border-[#172554] text-[#172554]"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            <Wallet className="h-4 w-4" />
                            Daftar Rekening ({accounts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("mutations")}
                            className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "mutations"
                                    ? "border-[#172554] text-[#172554]"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            <History className="h-4 w-4" />
                            Riwayat Mutasi & Penyesuaian
                        </button>
                    </div>

                    {/* Search & Filter Bar (Only for accounts tab) */}
                    {activeTab === "accounts" && (
                        <div className="flex items-center gap-2 pb-3">
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari rekening / bank..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 pl-9 text-xs rounded-xl border-slate-200"
                                />
                            </div>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option value="ALL">Semua Tipe</option>
                                <option value="BANK">Bank</option>
                                <option value="EWALLET">E-Wallet / QRIS</option>
                                <option value="CASH">Kas Tunai</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Tab 1: Detailed Table of Accounts */}
                {activeTab === "accounts" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#0F172A]">
                            <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-[#64748B] font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5">Rekening & Bank</th>
                                    <th className="px-6 py-3.5">Nomor Rekening</th>
                                    <th className="px-6 py-3.5">Atas Nama</th>
                                    <th className="px-6 py-3.5">Kategori</th>
                                    <th className="px-6 py-3.5 text-right">Saldo Terkini</th>
                                    <th className="px-6 py-3.5 text-center">Status</th>
                                    {isOwner && <th className="px-6 py-3.5 text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isAccountsLoading ? (
                                    <tr>
                                        <td colSpan={isOwner ? 7 : 6} className="px-6 py-8 text-center text-slate-500">
                                            Memuat daftar rekening...
                                        </td>
                                    </tr>
                                ) : filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={isOwner ? 7 : 6} className="px-6 py-8 text-center text-slate-500">
                                            Tidak ada rekening yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((acc) => {
                                        const isCopied = copiedId === acc.id;
                                        return (
                                            <tr
                                                key={acc.id}
                                                className="hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#172554] font-bold text-xs">
                                                            {acc.type === "CASH" ? "KAS" : acc.bankName.slice(0, 3).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                                                                {acc.name}
                                                                {acc.isPrimary && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                                        Utama
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-[#64748B]">
                                                                {acc.bankName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-mono text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span>{acc.accountNumber}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyAccountNumber(acc.accountNumber, acc.id)}
                                                            className="text-slate-400 hover:text-slate-600 p-1 rounded"
                                                            title="Salin No Rekening"
                                                        >
                                                            {isCopied ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                                    {acc.holderName}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${acc.type === "CASH"
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : acc.type === "EWALLET"
                                                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                            }`}
                                                    >
                                                        {acc.type === "CASH"
                                                            ? "Kas Tunai"
                                                            : acc.type === "EWALLET"
                                                                ? "E-Wallet / QRIS"
                                                                : "Bank"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right font-bold text-[#0F172A]">
                                                    {formatRupiah(acc.balance)}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${acc.isActive
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {acc.isActive ? "Aktif" : "Nonaktif"}
                                                    </span>
                                                </td>

                                                {isOwner && (
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setAdjustForm({
                                                                        accountId: acc.id,
                                                                        type: "INCOME",
                                                                        amount: 0,
                                                                        description: "",
                                                                        reference: "",
                                                                    });
                                                                    setIsAdjustModalOpen(true);
                                                                }}
                                                                className="h-8 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                                                            >
                                                                Mutasi
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditForm({
                                                                        id: acc.id,
                                                                        name: acc.name,
                                                                        bankName: acc.bankName,
                                                                        accountNumber: acc.accountNumber,
                                                                        holderName: acc.holderName,
                                                                        type: acc.type as "BANK" | "EWALLET" | "CASH",
                                                                        isActive: acc.isActive,
                                                                        isPrimary: acc.isPrimary,
                                                                        notes: acc.notes || "",
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>

                                                            {!acc.isPrimary && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setAccountToDelete({ id: acc.id, name: acc.name });
                                                                        setIsDeleteModalOpen(true);
                                                                    }}
                                                                    className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab 2: Recent Mutations History */}
                {activeTab === "mutations" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#0F172A]">
                            <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-[#64748B] font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5">Tanggal & Waktu</th>
                                    <th className="px-6 py-3.5">Rekening / Bank</th>
                                    <th className="px-6 py-3.5">Jenis Mutasi</th>
                                    <th className="px-6 py-3.5">Keterangan</th>
                                    <th className="px-6 py-3.5 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isMutationsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Memuat riwayat mutasi...
                                        </td>
                                    </tr>
                                ) : recentMutations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Belum ada riwayat mutasi atau penyesuaian saldo yang tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    recentMutations.map((mut) => {
                                        const isIncome = mut.type === "INCOME";
                                        const isExpense = mut.type === "EXPENSE";

                                        return (
                                            <tr
                                                key={mut.id}
                                                className="hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                                                    {dayjs(mut.createdAt).format("DD MMM YYYY, HH:mm")}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-xs text-[#0F172A]">
                                                        {mut.accountName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {mut.bankName} • {mut.accountNumber}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${isIncome
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : isExpense
                                                                    ? "bg-red-50 text-red-700 border border-red-200"
                                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                            }`}
                                                    >
                                                        {isIncome ? (
                                                            <ArrowDownLeft className="h-3 w-3" />
                                                        ) : isExpense ? (
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        ) : (
                                                            <RefreshCw className="h-3 w-3" />
                                                        )}
                                                        {isIncome
                                                            ? "Pemasukan / Setor"
                                                            : isExpense
                                                                ? "Pengeluaran / Tarik"
                                                                : "Koreksi Saldo"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-slate-700 max-w-xs">
                                                    <div>{mut.description}</div>
                                                    {mut.reference && (
                                                        <div className="text-[10px] text-slate-400">
                                                            Ref: {mut.reference}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right font-bold text-xs whitespace-nowrap">
                                                    <span
                                                        className={
                                                            isIncome
                                                                ? "text-emerald-600"
                                                                : isExpense
                                                                    ? "text-red-600"
                                                                    : "text-blue-600"
                                                        }
                                                    >
                                                        {isIncome ? "+" : isExpense ? "-" : ""}
                                                        {formatRupiah(mut.amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal 1: Tambah Rekening Baru */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#2563EB]" />
                            Tambah Rekening Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64748B]">
                            Daftarkan rekening bank, akun e-wallet, atau kas fisik toko ke sistem.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-sm">
                        {/* Preset Bank Dropdown */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Pilih Bank / Jenis Akun</Label>
                            <select
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none"
                                value={addForm.bankName}
                                onChange={(e) => {
                                    const selected = POPULAR_BANKS.find((b) => b.name === e.target.value);
                                    setAddForm((prev) => ({
                                        ...prev,
                                        bankName: e.target.value,
                                        type: (selected?.type as any) || "BANK",
                                        name: prev.name || (selected?.name ? `${selected.name} Operasional` : ""),
                                    }));
                                }}
                            >
                                {POPULAR_BANKS.map((b) => (
                                    <option key={b.name} value={b.name}>
                                        {b.name} - {b.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Nama Label Rekening */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Nama Label Rekening *</Label>
                            <Input
                                placeholder="Contoh: BCA Operasional Toko"
                                value={addForm.name}
                                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs"
                            />
                        </div>

                        {/* Nomor Rekening */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Nomor Rekening / No. HP / ID Kasir *</Label>
                            <Input
                                placeholder="Contoh: 8735129088 atau KASIR-01"
                                value={addForm.accountNumber}
                                onChange={(e) => setAddForm({ ...addForm, accountNumber: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs font-mono"
                            />
                        </div>

                        {/* Atas Nama Pemilik */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Atas Nama Pemilik (Holder Name) *</Label>
                            <Input
                                placeholder="Contoh: PT GTNIC KREATIF INDONESIA / Faiz"
                                value={addForm.holderName}
                                onChange={(e) => setAddForm({ ...addForm, holderName: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs"
                            />
                        </div>

                        {/* Saldo Awal */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Saldo Awal (Rp)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={addForm.balance || ""}
                                onChange={(e) => setAddForm({ ...addForm, balance: Number(e.target.value) || 0 })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs font-semibold"
                            />
                            <span className="mt-1 text-[11px] text-slate-400">
                                Terbaca: {formatRupiah(addForm.balance)}
                            </span>
                        </div>

                        {/* Toggle Rekening Utama */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                            <div>
                                <div className="text-xs font-semibold text-slate-800">Jadikan Rekening Utama</div>
                                <div className="text-[11px] text-slate-500">
                                    Akan ditandai sebagai rekening prioritas untuk pembayaran pelanggan.
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={addForm.isPrimary}
                                onChange={(e) => setAddForm({ ...addForm, isPrimary: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#172554] focus:ring-[#172554]"
                            />
                        </div>

                        {/* Catatan / Keterangan */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Catatan / Keperluan (Opsional)</Label>
                            <Input
                                placeholder="Contoh: Digunakan untuk settlement mesin EDC & transfer"
                                value={addForm.notes}
                                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                            className="rounded-xl border-slate-200 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                if (!addForm.name || !addForm.accountNumber || !addForm.holderName) {
                                    alert("Mohon lengkapi Nama Label, Nomor Rekening, dan Atas Nama.");
                                    return;
                                }
                                createAccountMutation.mutate(addForm);
                            }}
                            disabled={createAccountMutation.isPending}
                            className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium"
                        >
                            {createAccountMutation.isPending ? "Menyimpan..." : "Simpan Rekening"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Edit Rekening */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                            <Edit className="h-5 w-5 text-[#2563EB]" />
                            Edit Data Rekening
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64748B]">
                            Perbarui rincian informasi rekening ini.
                        </DialogDescription>
                    </DialogHeader>

                    {editForm && (
                        <div className="space-y-4 py-2 text-sm">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Nama Label Rekening</Label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Nama Bank / Metode</Label>
                                <Input
                                    value={editForm.bankName}
                                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Nomor Rekening</Label>
                                <Input
                                    value={editForm.accountNumber}
                                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                                    className="mt-1.5 rounded-xl border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Atas Nama Pemilik</Label>
                                <Input
                                    value={editForm.holderName}
                                    onChange={(e) => setEditForm({ ...editForm, holderName: e.target.value })}
                                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                                <div>
                                    <div className="text-xs font-semibold text-slate-800">Status Aktif</div>
                                    <div className="text-[11px] text-slate-500">
                                        Rekening aktif dapat digunakan untuk pembayaran kasir.
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editForm.isActive}
                                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-[#172554] focus:ring-[#172554]"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                                <div>
                                    <div className="text-xs font-semibold text-slate-800">Jadikan Rekening Utama</div>
                                    <div className="text-[11px] text-slate-500">
                                        Akan menjadi rekening prioritas di seluruh sistem.
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editForm.isPrimary}
                                    onChange={(e) => setEditForm({ ...editForm, isPrimary: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-[#172554] focus:ring-[#172554]"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Catatan</Label>
                                <Input
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="mt-1.5 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="rounded-xl border-slate-200 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                if (!editForm) return;
                                updateAccountMutation.mutate(editForm);
                            }}
                            disabled={updateAccountMutation.isPending}
                            className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium"
                        >
                            {updateAccountMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Penyesuaian Saldo / Catat Mutasi Kas */}
            <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                            Catat Mutasi & Penyesuaian Saldo
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64748B]">
                            Catat setoran modal, tarik tunai, hasil penjualan, atau koreksi selisih kas fisik.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-sm">
                        {/* Pilih Rekening */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Pilih Rekening Tujuan</Label>
                            <select
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none"
                                value={adjustForm.accountId}
                                onChange={(e) => setAdjustForm({ ...adjustForm, accountId: e.target.value })}
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bankName}) - Saldo: {formatRupiah(acc.balance)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Jenis Mutasi */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Jenis Transaksi</Label>
                            <div className="mt-1.5 grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAdjustForm({ ...adjustForm, type: "INCOME" })}
                                    className={`rounded-xl border p-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${adjustForm.type === "INCOME"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                    Setor / Masuk (+)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAdjustForm({ ...adjustForm, type: "EXPENSE" })}
                                    className={`rounded-xl border p-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${adjustForm.type === "EXPENSE"
                                            ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                                    Tarik / Keluar (-)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAdjustForm({ ...adjustForm, type: "ADJUSTMENT" })}
                                    className={`rounded-xl border p-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${adjustForm.type === "ADJUSTMENT"
                                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <RefreshCw className="h-4 w-4 text-blue-600" />
                                    Koreksi Saldo (=)
                                </button>
                            </div>
                        </div>

                        {/* Nominal */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">
                                {adjustForm.type === "ADJUSTMENT" ? "Set Saldo Baru Menjadi (Rp)" : "Nominal (Rp)"} *
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={adjustForm.amount || ""}
                                onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) || 0 })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs font-semibold"
                            />
                            <span className="mt-1 text-[11px] text-slate-500 font-medium">
                                Terbaca: {formatRupiah(adjustForm.amount)}
                            </span>
                        </div>

                        {/* Keterangan */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Keterangan / Keperluan Transaksi *</Label>
                            <Input
                                placeholder="Contoh: Setoran uang tunai hasil penjualan shift siang"
                                value={adjustForm.description}
                                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs"
                            />
                        </div>

                        {/* Nomor Referensi / Bukti */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Nomor Referensi / No. Struk (Opsional)</Label>
                            <Input
                                placeholder="Contoh: REF-BCA-982173 atau STRUK-001"
                                value={adjustForm.reference}
                                onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })}
                                className="mt-1.5 rounded-xl border-slate-200 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsAdjustModalOpen(false)}
                            className="rounded-xl border-slate-200 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                if (!adjustForm.accountId) {
                                    alert("Pilih rekening terlebih dahulu.");
                                    return;
                                }
                                if (adjustForm.amount <= 0 && adjustForm.type !== "ADJUSTMENT") {
                                    alert("Nominal harus lebih dari 0.");
                                    return;
                                }
                                if (!adjustForm.description) {
                                    alert("Keterangan transaksi wajib diisi.");
                                    return;
                                }
                                adjustBalanceMutation.mutate(adjustForm);
                            }}
                            disabled={adjustBalanceMutation.isPending}
                            className="rounded-xl bg-[#172554] text-white hover:bg-[#172554]/90 text-xs font-medium"
                        >
                            {adjustBalanceMutation.isPending ? "Memproses..." : "Konfirmasi Transaksi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 4: Konfirmasi Hapus Rekening */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Hapus Rekening?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 mt-2">
                            Apakah Anda yakin ingin menghapus rekening{" "}
                            <strong className="text-slate-900">{accountToDelete?.name}</strong>? Seluruh data riwayat mutasi terkait rekening ini akan ikut terhapus.
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
                                if (accountToDelete) {
                                    deleteAccountMutation.mutate({ id: accountToDelete.id });
                                }
                            }}
                            disabled={deleteAccountMutation.isPending}
                            className="rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                        >
                            {deleteAccountMutation.isPending ? "Menghapus..." : "Ya, Hapus Rekening"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

