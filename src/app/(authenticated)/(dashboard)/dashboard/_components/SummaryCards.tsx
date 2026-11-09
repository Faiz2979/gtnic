// src/app/(authenticated)/(dashboard)/dashboard/_components/SummaryCards.tsx
"use client";

import { Card } from "@/components/ui/card";
import {
    ArrowDownRight,
    ArrowUpRight,
    Landmark,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

interface SummaryCardsProps {
    role: "OWNER" | "STAFF";
    totalRevenue: number;
    totalCapital?: number;
    totalProfit?: number;
    transactionCount: number;
    totalProducts?: number;
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function SummaryCards({
    role,
    totalRevenue,
    totalCapital,
    totalProfit,
    transactionCount,
    totalProducts,
}: SummaryCardsProps) {
    if (role === "OWNER") {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Pemasukan bulan ini */}
                <Card className="flex items-start justify-between p-5">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Pemasukan bulan ini
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                            {formatRupiah(totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {transactionCount} transaksi
                        </p>
                    </div>
                    <div className="rounded-lg bg-success-tint p-2.5">
                        <TrendingUp
                            size={20}
                            className="text-success"
                            strokeWidth={2}
                        />
                    </div>
                </Card>

                {/* Pengeluaran / Modal bulan ini */}
                <Card className="flex items-start justify-between p-5">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Pengeluaran bulan ini
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                            {formatRupiah(totalCapital ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Modal produk
                        </p>
                    </div>
                    <div className="rounded-lg bg-danger-tint p-2.5">
                        <TrendingDown
                            size={20}
                            className="text-destructive"
                            strokeWidth={2}
                        />
                    </div>
                </Card>

                {/* Laba Bersih */}
                <Card className="flex items-start justify-between p-5">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Laba bersih bulan ini
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                            {formatRupiah(totalProfit ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {totalProfit && totalRevenue
                                ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin`
                                : "—"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-info-tint p-2.5">
                        <Landmark
                            size={20}
                            className="text-accent"
                            strokeWidth={2}
                        />
                    </div>
                </Card>
            </div>
        );
    }

    // STAFF view — lebih sederhana
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total penjualan */}
            <Card className="flex items-start justify-between p-5">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Penjualan bulan ini
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                        {formatRupiah(totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {transactionCount} transaksi
                    </p>
                </div>
                <div className="rounded-lg bg-success-tint p-2.5">
                    <ArrowUpRight
                        size={20}
                        className="text-success"
                        strokeWidth={2}
                    />
                </div>
            </Card>

            {/* Total transaksi */}
            <Card className="flex items-start justify-between p-5">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Total transaksi
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                        {transactionCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Bulan ini
                    </p>
                </div>
                <div className="rounded-lg bg-info-tint p-2.5">
                    <ArrowDownRight
                        size={20}
                        className="text-accent"
                        strokeWidth={2}
                    />
                </div>
            </Card>

            {/* Total produk */}
            <Card className="flex items-start justify-between p-5">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Total produk
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                        {totalProducts ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Produk terdaftar
                    </p>
                </div>
                <div className="rounded-lg bg-warning-tint p-2.5">
                    <Wallet
                        size={20}
                        className="text-warning"
                        strokeWidth={2}
                    />
                </div>
            </Card>
        </div>
    );
}
