// src/server/routers/dashboard/dashboard.actions.ts
import { TRPCError } from "@trpc/server";
import { dashboardRepository } from "./dashboard.repository";

/**
 * Helper: Generate array of period strings untuk N bulan terakhir
 * Format: "YYYY-MM"
 */
function getLastNPeriods(n: number): string[] {
    const periods: string[] = [];
    const now = new Date();

    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        periods.push(`${year}-${month}`);
    }

    return periods;
}

/**
 * Helper: Get current period string
 */
function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const dashboardActions = {
    /**
     * Dashboard lengkap untuk OWNER — akses semua data
     */
    async getOwnerDashboard() {
        try {
            const currentPeriod = getCurrentPeriod();
            const periods = getLastNPeriods(6);

            const [
                monthSummary,
                cashFlow,
                recentTransactions,
                totalProducts,
                lowStockItems,
                totalStaff,
                lastClosing,
            ] = await Promise.all([
                dashboardRepository.getMonthSummary(currentPeriod),
                dashboardRepository.getCashFlowSummary(periods),
                dashboardRepository.getRecentTransactions(5),
                dashboardRepository.getTotalProducts(),
                dashboardRepository.getLowStockItems(currentPeriod),
                dashboardRepository.getTotalStaff(),
                dashboardRepository.getLastClosing(),
            ]);

            return {
                currentPeriod,
                monthSummary,
                cashFlow,
                recentTransactions: recentTransactions.map((tx) => ({
                    id: tx.id,
                    productName: tx.product.name,
                    createdByName: tx.createdBy.fullName,
                    quantity: tx.quantity,
                    sellingPrice: Number(tx.sellingPrice),
                    costPrice: Number(tx.costPrice),
                    totalProfit: Number(tx.totalProfit),
                    createdAt: tx.createdAt,
                })),
                totalProducts,
                lowStockItems: lowStockItems.map((item) => ({
                    id: item.id,
                    productName: item.product.name,
                    currentStock: item.currentStock,
                    period: item.period,
                })),
                totalStaff,
                lastClosing: lastClosing
                    ? {
                          period: lastClosing.period,
                          totalRevenue: Number(lastClosing.totalRevenue),
                          totalCapital: Number(lastClosing.totalCapital),
                          netProfit: Number(lastClosing.netProfit),
                          closedBy: lastClosing.closedBy.fullName,
                          closedAt: lastClosing.closedAt,
                      }
                    : null,
            };
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengambil data dashboard owner.",
                cause: error,
            });
        }
    },

    /**
     * Dashboard untuk STAFF — hanya data terbatas (transaksi terbaru, ringkasan bulan ini)
     */
    async getStaffDashboard(_userId: string) {
        try {
            const currentPeriod = getCurrentPeriod();

            const [monthSummary, recentTransactions, totalProducts] =
                await Promise.all([
                    dashboardRepository.getMonthSummary(currentPeriod),
                    dashboardRepository.getRecentTransactions(5),
                    dashboardRepository.getTotalProducts(),
                ]);

            return {
                currentPeriod,
                monthSummary: {
                    totalRevenue: monthSummary.totalRevenue,
                    transactionCount: monthSummary.transactionCount,
                },
                recentTransactions: recentTransactions.map((tx) => ({
                    id: tx.id,
                    productName: tx.product.name,
                    createdByName: tx.createdBy.fullName,
                    quantity: tx.quantity,
                    sellingPrice: Number(tx.sellingPrice),
                    createdAt: tx.createdAt,
                })),
                totalProducts,
            };
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengambil data dashboard staff.",
                cause: error,
            });
        }
    },
};
