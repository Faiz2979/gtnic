"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import logoFinaraIcon from "@/_assets/logo_finara.png";
import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";
import { useSidebar } from "./sidebar-context";
import {
    ArrowLeftRight,
    Building2,
    CalendarCheck2,
    ChartNoAxesCombined,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Package,
    ReceiptText,
    Settings2,
    Users,
    Wallet,
} from "lucide-react";

interface SidebarProps {
    children: React.ReactNode;
    activePage?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    ownerOnly?: boolean;
}

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produk & Stok", href: "/product", icon: Package, ownerOnly: true },
    { name: "Transaksi", href: "/transaksi", icon: ArrowLeftRight },
    { name: "Manajemen Staf", href: "/staff", icon: Users, ownerOnly: true },
    { name: "Closing Bulanan", href: "/closing", icon: CalendarCheck2, ownerOnly: true },
    { name: "Rekening", href: "/rekening", icon: Wallet, ownerOnly: true },
    { name: "Tagihan", href: "/tagihan", icon: ReceiptText, ownerOnly: true },
    { name: "Laporan", href: "/laporan", icon: ChartNoAxesCombined, ownerOnly: true },
];

export function Sidebar({ children, activePage }: SidebarProps) {
    const pathname = usePathname();
    const { isCollapsed, toggleCollapse } = useSidebar();
    const [businessName, setBusinessName] = useState("PT Nusantara Digital");

    const { data: profile } = trpc.user.getCurrentProfile.useQuery();
    const isOwner = profile?.role === ROLE.OWNER;

    const visibleNavItems = navigation.filter((item) => {
        if (item.ownerOnly) return isOwner;
        return true;
    });

    useEffect(() => {
        const saved = localStorage.getItem("finara_business_name");
        if (saved) setBusinessName(saved);

        const handleUpdate = () => {
            const updated = localStorage.getItem("finara_business_name");
            if (updated) setBusinessName(updated);
        };

        window.addEventListener("business_profile_updated", handleUpdate);
        window.addEventListener("storage", handleUpdate);
        return () => {
            window.removeEventListener("business_profile_updated", handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, []);

    const isSettingsActive = activePage
        ? activePage === "Pengaturan"
        : pathname.startsWith("/pengaturan");

    return (
        <div className="flex min-h-screen bg-[#F4F6F9]">
            <aside
                className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between bg-[#0F1E36] text-white z-30 transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-[76px] p-3" : "w-[250px] p-4"
                }`}
            >
                <div className="overflow-y-auto no-scrollbar">
                    <div className="mb-4">
                        <Link
                            href="/dashboard"
                            className={`flex items-center rounded-2xl bg-white/[0.06] border border-white/10 transition-all duration-200 hover:bg-white/[0.1] ${
                                isCollapsed ? "p-2 justify-center" : "px-3 py-2.5 gap-3"
                            }`}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-xs shrink-0">
                                <Image
                                    src={logoFinaraIcon}
                                    alt="Finara"
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold tracking-tight text-white leading-tight">
                                        Finara
                                    </div>
                                    <div className="text-[10px] font-medium text-blue-300/80 tracking-wider uppercase">
                                        Smart Ledger
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>

                    {isCollapsed ? (
                        <div
                            className="mb-4 flex justify-center"
                            title={`${businessName} (${isOwner ? "Owner" : "Staff"})`}
                        >
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-white/70">
                                <Building2 size={16} />
                                <span
                                    className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#0F1E36] ${
                                        isOwner ? "bg-emerald-400" : "bg-blue-400"
                                    }`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                                    Ruang Kerja
                                </span>
                                {profile?.role && (
                                    <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            isOwner
                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                : "bg-blue-400/20 text-blue-200 border border-blue-400/30"
                                        }`}
                                    >
                                        {isOwner ? "Owner" : "Staff"}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-white/90 truncate" title={businessName}>
                                {businessName}
                            </p>
                        </div>
                    )}

                    <nav className="flex flex-col gap-1">
                        {visibleNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage
                                ? activePage === item.name
                                : pathname === item.href ||
                                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isCollapsed ? item.name : undefined}
                                    className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                                        isCollapsed ? "justify-center h-10 w-full" : "gap-3 px-3 py-2 text-xs font-medium"
                                    } ${
                                        isActive
                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                            : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                                    }`}
                                >
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                                            isActive ? "bg-white/20 text-white" : "text-slate-400 group-hover:text-white"
                                        }`}
                                    >
                                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.9} />
                                    </div>

                                    {!isCollapsed && <span className="truncate">{item.name}</span>}

                                    {isCollapsed && (
                                        <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg border border-slate-800 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="pt-3 border-t border-white/10">
                    <Link
                        href="/pengaturan"
                        title={isCollapsed ? "Pengaturan" : undefined}
                        className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                            isCollapsed ? "justify-center h-10 w-full" : "gap-3 px-3 py-2 text-xs font-medium"
                        } ${
                            isSettingsActive
                                ? "bg-blue-600 text-white font-semibold shadow-xs"
                                : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                        }`}
                    >
                        <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                                isSettingsActive ? "bg-white/20 text-white" : "text-slate-400 group-hover:text-white"
                            }`}
                        >
                            <Settings2 size={16} strokeWidth={isSettingsActive ? 2.2 : 1.9} />
                        </div>
                        {!isCollapsed && <span className="truncate">Pengaturan</span>}

                        {isCollapsed && (
                            <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg border border-slate-800 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                                Pengaturan
                            </div>
                        )}
                    </Link>

                    <div className="mt-2 pt-2 border-t border-white/5">
                        <Link
                            href="/pengaturan"
                            title={isCollapsed ? `${profile?.fullName || "Profil"} (${isOwner ? "Owner" : "Staff"})` : undefined}
                            className={`flex items-center rounded-lg transition-colors hover:bg-white/5 ${
                                isCollapsed ? "justify-center p-1" : "gap-2.5 px-2 py-1.5"
                            }`}
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white font-semibold text-xs shrink-0">
                                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-white truncate">
                                        {profile?.fullName || "Pengguna"}
                                    </p>
                                    <p className="text-[10px] text-white/50 truncate">
                                        {isOwner ? "Owner" : "Staff"}
                                    </p>
                                </div>
                            )}
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={toggleCollapse}
                        aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
                        className={`mt-2 flex items-center rounded-lg bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors border border-white/5 ${
                            isCollapsed ? "h-9 w-full justify-center" : "h-8 w-full px-2.5 justify-between text-xs font-medium"
                        }`}
                    >
                        {!isCollapsed && <span>Ciutkan</span>}
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>
            </aside>

            <div className="min-w-0 flex-1 bg-[#F4F6F9]">
                {children}
            </div>
        </div>
    );
}
