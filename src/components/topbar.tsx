"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    Search,
    ChevronDown,
    User,
    Settings,
    LogOut,
    ShieldCheck,
    UserCheck,
    PanelLeft,
    X,
    ArrowRight,
    Package,
    ArrowLeftRight,
    Wallet,
    ReceiptText,
    ChartNoAxesCombined,
    CalendarCheck2,
    CheckCircle2,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { DynamicBreadcrumb } from "./dynamic-breadcrumb";
import { useSidebar } from "./sidebar-context";
import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";
import { createClient } from "@/app/lib/supabase/client";

interface TopbarProps {
    userInitials?: string;
    onNotificationClick?: () => void;
    onProfileClick?: () => void;
}

export function Topbar({
    userInitials,
    onNotificationClick,
    onProfileClick,
}: TopbarProps) {
    const router = useRouter();
    const supabase = createClient();
    const { isCollapsed, toggleCollapse } = useSidebar();

    const { data: profile } = trpc.user.getCurrentProfile.useQuery();
    const isOwner = profile?.role === ROLE.OWNER;
    const displayName = profile?.fullName || "Pengguna";
    const firstName = displayName.split(" ")[0];
    const initials = userInitials || (displayName ? displayName.charAt(0).toUpperCase() : "U");

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setIsProfileOpen(false);
                setIsNotifOpen(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleLogout = async () => {
        if (!confirm("Apakah Anda yakin ingin keluar dari akun ini?")) return;
        try {
            await supabase.auth.signOut();
            router.push("/auth/login");
        } catch {
            alert("Gagal keluar dari akun.");
        }
    };

    const searchableItems = [
        { name: "Dashboard", href: "/dashboard", desc: "Ringkasan metrik & performa bisnis", icon: ArrowRight },
        ...(isOwner ? [{ name: "Produk & Stok", href: "/product", desc: "Katalog barang, modal HPP, dan stok", icon: Package }] : []),
        { name: "Transaksi", href: "/transaksi", desc: "Catat penjualan kasir & kas keluar", icon: ArrowLeftRight },
        ...(isOwner ? [{ name: "Buku Rekening & Kas", href: "/rekening", desc: "Saldo bank BCA, Mandiri, dan kas toko", icon: Wallet }] : []),
        ...(isOwner ? [{ name: "Tagihan & Faktur", href: "/tagihan", desc: "Piutang pelanggan & utang operasional", icon: ReceiptText }] : []),
        ...(isOwner ? [{ name: "Laporan Keuangan", href: "/laporan", desc: "Laba rugi P&L, omzet, dan margin", icon: ChartNoAxesCombined }] : []),
        ...(isOwner ? [{ name: "Closing Bulanan", href: "/closing", desc: "Rekapitulasi & tutup buku periodik", icon: CalendarCheck2 }] : []),
        { name: "Pengaturan Akun", href: "/pengaturan", desc: "Profil, nama bisnis, dan keamanan", icon: Settings },
    ];

    const filteredItems = searchQuery
        ? searchableItems.filter((i) =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.desc.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : searchableItems;

    // Data Notifikasi Sistem
    const notifications = [
        {
            id: 1,
            title: "Sistem Pembukuan Finara Aktif",
            desc: "Selamat datang di sistem manajemen kasir & keuangan terintegrasi.",
            time: "Baru saja",
            type: "info",
        },
        {
            id: 2,
            title: "Peringatan Stok Produk",
            desc: "Beberapa stok produk menipis. Cek menu Produk & Stok untuk restok.",
            time: "Hari ini",
            type: "warning",
        },
        {
            id: 3,
            title: "Tutup Buku Periode Berjalan",
            desc: "Pastikan seluruh transaksi tercatat sebelum tanggal closing akhir bulan.",
            time: "1 hari yang lalu",
            type: "reminder",
        },
    ];

    return (
        <>
            <header className="
                sticky top-0 z-20
                flex h-[72px] w-full shrink-0
                items-center justify-between
                border-b border-[#E2E8F0]
                bg-white/95 backdrop-blur-md px-6 sm:px-7
                transition-all duration-200
            ">
                {/* Left Section: Sidebar Toggle + Breadcrumb */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        aria-label="Toggle Sidebar"
                        title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200"
                    >
                        <PanelLeft size={19} strokeWidth={1.8} />
                    </button>

                    <div className="h-4 w-px bg-slate-200" />

                    <DynamicBreadcrumb />
                </div>

                {/* Right Section: Search + Notifications + Profile Pill */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Tombol Search Cepat (Cmd+K) */}
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        aria-label="Search"
                        title="Pencarian Cepat (Ctrl+K / Cmd+K)"
                        className="group flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all text-xs font-medium"
                    >
                        <Search size={16} strokeWidth={2} className="text-slate-400 group-hover:text-slate-700" />
                        <span className="hidden md:inline text-slate-400">Cari menu...</span>
                        <kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 text-[10px] font-mono text-slate-400 shadow-2xs">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Popover Notifikasi */}
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsNotifOpen((prev) => !prev);
                                if (onNotificationClick) onNotificationClick();
                            }}
                            aria-label="Notifications"
                            className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                                isNotifOpen
                                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <Bell size={17} strokeWidth={2} />
                            {/* Unread indicator dot */}
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                        </button>

                        {/* Dropdown Notifikasi */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-[#2563EB]" />
                                        <h3 className="text-xs font-bold text-slate-900">Notifikasi Sistem</h3>
                                    </div>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                        {notifications.length} Baru
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pt-1">
                                    {notifications.map((item) => (
                                        <div key={item.id} className="py-2.5 px-1 hover:bg-slate-50/80 rounded-xl transition-colors">
                                            <div className="flex items-start gap-2.5">
                                                <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                                                    item.type === "warning"
                                                        ? "bg-amber-100 text-amber-600"
                                                        : item.type === "reminder"
                                                        ? "bg-indigo-100 text-indigo-600"
                                                        : "bg-emerald-100 text-emerald-600"
                                                }`}>
                                                    {item.type === "warning" ? (
                                                        <AlertTriangle size={13} />
                                                    ) : item.type === "reminder" ? (
                                                        <Clock size={13} />
                                                    ) : (
                                                        <CheckCircle2 size={13} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                                        {item.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 mt-1 border-t border-slate-100 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsNotifOpen(false)}
                                        className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                                    >
                                        Tutup Notifikasi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Popover Profile User Pill (Mirip Referensi Foto) */}
                    <div className="relative" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsProfileOpen((prev) => !prev);
                                if (onProfileClick) onProfileClick();
                            }}
                            aria-label="User Profile"
                            className={`flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-full border transition-all ${
                                isProfileOpen
                                    ? "border-[#2563EB] bg-blue-50/50 shadow-sm"
                                    : "border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                            {/* Avatar Circle */}
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#172554] text-[11px] font-bold text-white shadow-xs">
                                {initials}
                            </div>

                            {/* User First Name */}
                            <span className="text-xs font-semibold text-slate-800 hidden sm:inline max-w-[120px] truncate">
                                {firstName}
                            </span>

                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${
                                isProfileOpen ? "rotate-180" : ""
                            }`} />
                        </button>

                        {/* Dropdown Menu Profile */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                                {/* Header Info */}
                                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 mb-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172554] text-sm font-bold text-white shadow-sm shrink-0">
                                        {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {displayName}
                                        </p>
                                        <p className="text-[10px] text-slate-500 truncate">
                                            {profile?.email || "user@akufaiz.my.id"}
                                        </p>
                                        <div className="mt-1">
                                            {isOwner ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                                                    <ShieldCheck size={10} /> Owner
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-800">
                                                    <UserCheck size={10} /> Staff Kasir
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Links */}
                                <div className="space-y-0.5">
                                    <Link
                                        href="/pengaturan"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <User size={15} className="text-slate-400" />
                                        <span>Profil Pengguna</span>
                                    </Link>

                                    <Link
                                        href="/pengaturan"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <Settings size={15} className="text-slate-400" />
                                        <span>Pengaturan Sistem</span>
                                    </Link>
                                </div>

                                <div className="my-1.5 border-t border-slate-100" />

                                {/* Logout Button */}
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <LogOut size={15} className="text-red-500" />
                                    <span>Keluar Akun (Logout)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Modal Dialog Pencarian Cepat (Command Palette) */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Search Input Bar */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                            <Search size={18} className="text-slate-400 shrink-0" />
                            <input
                                type="text"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari halaman, menu, atau fitur..."
                                className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={15} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(false)}
                                className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-200"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Search Results List */}
                        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
                            {filteredItems.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
                                </div>
                            ) : (
                                filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsSearchOpen(false)}
                                            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                                        </Link>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-400">
                            <span>Tekan <kbd className="font-mono bg-white border border-slate-200 px-1 rounded">↵</kbd> untuk memilih</span>
                            <span>Finara Navigation Helper</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
