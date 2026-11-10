// src/server/routers/dashboard/dashboard.repository.ts
import { prisma } from "@/lib/prisma";

export const dashboardRepository = {

    async getMonthSummary(period: string) {
        const transactions = await prisma.transaction.findMany({
            where: { period },
            select: {
                quantity: true,
                costPrice: true,
                sellingPrice: true,
                totalProfit: true,
            },
        });

        let totalRevenue = 0;
        let totalCapital = 0;
        let totalProfit = 0;

        for (const tx of transactions) {
            const revenue = Number(tx.sellingPrice) * tx.quantity;
            const capital = Number(tx.costPrice) * tx.quantity;
            totalRevenue += revenue;
            totalCapital += capital;
            totalProfit += Number(tx.totalProfit);
        }

        return {
            totalRevenue,
            totalCapital,
            totalProfit,
            transactionCount: transactions.length,
        };
    },

    /**
     * Ambil ringkasan arus kas untuk 6 bulan terakhir (untuk chart)
     */
    async getCashFlowSummary(periods: string[]) {
        const results = [];

        for (const period of periods) {
            const transactions = await prisma.transaction.findMany({
                where: { period },
                select: {
                    quantity: true,
                    costPrice: true,
                    sellingPrice: true,
                },
            });

            let pemasukan = 0;
            let pengeluaran = 0;

            for (const tx of transactions) {
                pemasukan += Number(tx.sellingPrice) * tx.quantity;
                pengeluaran += Number(tx.costPrice) * tx.quantity;
            }

            results.push({
                period,
                pemasukan,
                pengeluaran,
            });
        }

        return results;
    },

    /**
     * Ambil transaksi terbaru (limit 5)
     */
    async getRecentTransactions(limit: number = 5) {
        return await prisma.transaction.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });
    },

    /**
     * Hitung total produk
     */
    async getTotalProducts() {
        return await prisma.product.count();
    },

    /**
     * Ambil inventaris dengan stok rendah (< threshold)
     */
    async getLowStockItems(period: string, threshold: number = 10) {
        return await prisma.monthlyInventory.findMany({
            where: {
                period,
                status: "ACTIVE",
                currentStock: {
                    lte: threshold,
                },
            },
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { currentStock: "asc" },
            take: 5,
        });
    },

    /**
     * Hitung total staf/karyawan
     */
    async getTotalStaff() {
        return await prisma.profile.count({
            where: { role: "STAFF" },
        });
    },

    /**
     * Ambil closing summary terakhir
     */
    async getLastClosing() {
        return await prisma.monthlyClosing.findFirst({
            orderBy: { closedAt: "desc" },
            include: {
                closedBy: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });
    },
};
