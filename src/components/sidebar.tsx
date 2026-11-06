
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
        <div className="flex min-h-screen ">

            {/* Sidebar */}
            <aside className="
                flex h-screen w-[250px] shrink-0
                flex-col 
                bg-primary
                px-5 py-6
                text-primary-foreground
            ">

                {/* Header */}
                <div className="mb-7 flex items-center gap-3">
                    <BookOpenCheck
                        size={27}
                        strokeWidth={1.8}
                    />

                    <h1 className="text-xl font-semibold tracking-tight">
                        smart ledger
                    </h1>
                </div>

                {/* Workspace */}
                <div className="
                    mb-7 rounded-lg
                    bg-primary-foreground/10
                    px-3 py-3
                ">
                    <p className="mb-1 text-xs text-primary-foreground/70">
                        Ruang kerja
                    </p>

                    <p className="text-sm font-medium">
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
                                    rounded-lg px-3 py-3
                                    text-sm transition-colors
                                    ${
                                        isActive
                                            ? "bg-accent text-accent-foreground"
                                            : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                    }
                                `}
                            >
                                <Icon size={19} strokeWidth={1.9} />
                                <span>{item.name}</span>
                            </a>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto">

                    {/* Settings */}
                    <a
                        href="/pengaturan"
                        className={`
                            flex items-center gap-3
                            rounded-lg px-3 py-3
                            text-sm transition-colors
                            ${
                                activePage === "Pengaturan"
                                    ? "bg-accent text-accent-foreground"
                                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            }
                        `}
                    >
                        <Settings2 size={19} strokeWidth={1.9} />
                        <span>Pengaturan</span>
                    </a>

                    {/* Footer */}
                    <div className="
                        mt-7 border-t
                        border-primary-foreground/15
                        pt-4 text-[11px] leading-6
                        text-primary-foreground/70
                    ">
                        <p>SIDEBAR · 250px</p>
                        <p>Light Mode · shell navy</p>
                    </div>

                </div>
            </aside>

            {/* Main Content */}
            <main className="min-w-0 flex-1">
                {children}
            </main>

        </div>
    );
}
