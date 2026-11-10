"use client";

import {
    ArrowLeftRight,
    BookOpenCheck,
    CalendarCheck2,
    ChartNoAxesCombined,
    LayoutDashboard,
    Package,
    ReceiptText,
    Settings2,
    Users,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { trpc } from "@/client/trpc";
import { ROLE } from "@/utils/enums/user-role.enum";

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

export function Sidebar({
    children,
    activePage,
}: SidebarProps) {
    const pathname = usePathname();
    const [businessName, setBusinessName] = React.useState("PT Nusantara Digital");

    // Ambil data profil untuk proteksi menu berdasarkan Role (Owner vs Staff)
    const { data: profile } = trpc.user.getCurrentProfile.useQuery();
    const isOwner = profile?.role === ROLE.OWNER;

    // Filter menu: Staf hanya melihat menu umum, menu ownerOnly disembunyikan
    const visibleNavItems = navigation.filter((item) => {
        if (item.ownerOnly) {
            return isOwner;
        }
        return true;
    });

    React.useEffect(() => {
        // Ambil nama usaha tersimpan dari localStorage saat pertama kali load
        const saved = localStorage.getItem("finara_business_name");
        if (saved) {
            setBusinessName(saved);
        }

        // Tangkap event perubahan nama usaha secara real-time dari Pengaturan
        const handleUpdate = () => {
            const updated = localStorage.getItem("finara_business_name");
            if (updated) {
                setBusinessName(updated);
            }
        };

        window.addEventListener("business_profile_updated", handleUpdate);
        window.addEventListener("storage", handleUpdate);
        return () => {
            window.removeEventListener("business_profile_updated", handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* Sidebar Sticky */}
            <aside className="
                sticky top-0
                flex h-screen w-[250px] shrink-0
                flex-col justify-between
                bg-[#172554]
                px-5 py-6
                text-white
                overflow-y-auto
                z-30
            ">
                <div>
                    {/* Header Logo */}
                    <div className="mb-7 flex items-center gap-3">
                        <BookOpenCheck
                            size={27}
                            strokeWidth={1.8}
                            className="text-white shrink-0"
                        />

                        <h1 className="text-xl font-semibold tracking-tight text-white">
                            smart ledger
                        </h1>
                    </div>

                    {/* Workspace Pill */}
                    <div className="
                        mb-7 rounded-xl
                        bg-white/10
                        px-3.5 py-3
                    ">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-white/70">
                                Ruang kerja
                            </p>
                            {profile?.role && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isOwner 
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                                        : "bg-blue-400/20 text-blue-200 border border-blue-400/30"
                                }`}>
                                    {isOwner ? "Owner" : "Staff"}
                                </span>
                            )}
                        </div>

                        <p className="text-sm font-medium text-white truncate" title={businessName}>
                            {businessName}
                        </p>
                    </div>

                    <nav className="flex flex-col gap-2">
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
                                    className={`
                                        flex items-center gap-3
                                        rounded-xl px-3.5 py-3
                                        text-sm font-medium transition-colors
                                        ${
                                            isActive
                                                ? "bg-[#2563EB] text-white shadow-sm"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon size={19} strokeWidth={1.9} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="pt-6">
                    {/* Settings */}
                    {(() => {
                        const isSettingsActive = activePage
                            ? activePage === "Pengaturan"
                            : pathname.startsWith("/pengaturan");

                        return (
                            <Link
                                href="/pengaturan"
                                className={`
                                    flex items-center gap-3
                                    rounded-xl px-3.5 py-3
                                    text-sm font-medium transition-colors
                                    ${
                                        isSettingsActive
                                            ? "bg-[#2563EB] text-white shadow-sm"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }
                                `}
                            >
                                <Settings2 size={19} strokeWidth={1.9} />
                                <span>Pengaturan</span>
                            </Link>
                        );
                    })()}

                    {/* Footer Annotations */}
                    <div className="
                        mt-6 border-t
                        border-white/15
                        pt-4 text-[11px] leading-5
                        text-white/40
                    ">
                        <p>SIDEBAR · 250px</p>
                        <p>Light Mode · shell navy</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="min-w-0 flex-1 bg-[#F8FAFC]">
                {children}
            </div>

        </div>
    );
}
