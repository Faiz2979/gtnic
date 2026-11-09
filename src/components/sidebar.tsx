"use client";

import {
    ArrowLeftRight,
    BookOpenCheck,
    ChartNoAxesCombined,
    LayoutDashboard,
    ReceiptText,
    Settings2,
    Wallet,
} from "lucide-react";
import React from "react";

interface SidebarProps {
    children: React.ReactNode;
    activePage?: string;
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transaksi", href: "/transaksi", icon: ArrowLeftRight },
    { name: "Rekening", href: "/rekening", icon: Wallet },
    { name: "Tagihan", href: "/tagihan", icon: ReceiptText },
    { name: "Laporan", href: "/laporan", icon: ChartNoAxesCombined },
];

export function Sidebar({
    children,
    activePage = "Dashboard",
}: SidebarProps) {
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* Sidebar Sticky agar tidak ikut terscroll & tidak kepotong */}
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
                        <p className="mb-1 text-xs text-white/70">
                            Ruang kerja
                        </p>

                        <p className="text-sm font-medium text-white truncate">
                            PT Nusantara Digital
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.name;

                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3
                                        rounded-xl px-3.5 py-3
                                        text-sm font-medium transition-colors
                                        ${isActive
                                            ? "bg-[#2563EB] text-white shadow-sm"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon size={19} strokeWidth={1.9} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="pt-6">
                    {/* Settings */}
                    <a
                        href="/pengaturan"
                        className={`
                            flex items-center gap-3
                            rounded-xl px-3.5 py-3
                            text-sm font-medium transition-colors
                            ${activePage === "Pengaturan"
                                ? "bg-[#2563EB] text-white shadow-sm"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }
                        `}
                    >
                        <Settings2 size={19} strokeWidth={1.9} />
                        <span>Pengaturan</span>
                    </a>

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
