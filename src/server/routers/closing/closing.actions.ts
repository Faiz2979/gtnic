// src/server/routers/closing/closing.actions.ts
import { INVENTORY_STATUS } from "@/utils/enums/inventory-status.enum";
import dayjs from "dayjs";
import { ClosingRepository } from "./closing.repository";

export const ClosingActions = {
  // 1. Logika untuk Preview Closing (Sebelum Owner menekan tombol konfirmasi)
  previewClosing: async (period: string) => {
    const inventories = await ClosingRepository.getActiveInventories(period);
    
    if (!inventories.length) {
      throw new Error(`Tidak ada inventaris aktif untuk periode ${period}`);
    }

    // Ambil transaksi langsung berdasarkan period (YYYY-MM)
    const transactions = await ClosingRepository.getTransactionsByPeriod(period);

    let totalRevenue = 0;
    let totalCapital = 0;
    let totalProfit = 0;

    // Kalkulasi omzet, modal, dan laba dari transaksi bulan ini
    for (const trx of transactions) {
      const qty = trx.quantity;
      const revenue = qty * Number(trx.sellingPrice);
      const capital = qty * Number(trx.costPrice);
      const profit = Number(trx.totalProfit);

      totalRevenue += revenue;
      totalCapital += capital;
      totalProfit += profit;
    }

    return {
      period,
      summary: {
        totalTransactions: transactions.length,
        totalRevenue,
        totalCapital,
        netProfit: totalProfit,
      },
      previewInventories: inventories.map((inv) => ({
        productId: inv.productId,
        productName: inv.product.name,
        initialStock: inv.initialStock,
        addedStock: inv.addedStock,
        currentStock: inv.currentStock, // Stok akhir berjalan yang akan dibawa ke bulan depan
      })),
    };
  },

  // 2. Logika Eksekusi Closing (Dipanggil setelah Owner menyetujui modal preview)
  executeClosing: async (period: string, closedById: string) => {
    // Ambil data preview untuk memastikan kalkulasi final sinkron
    const previewData = await ClosingActions.previewClosing(period);

    // Tentukan periode berikutnya (format "YYYY-MM")
    const nextPeriod = dayjs(`${period}-01`).add(1, "month").format("YYYY-MM");

    const inventoryUpdates = [];
    const nextPeriodInventories = [];

    for (const item of previewData.previewInventories) {
      const activeInventories = await ClosingRepository.getActiveInventories(period);
      const target = activeInventories.find((i) => i.productId === item.productId);

      if (target) {
        inventoryUpdates.push({
          id: target.id,
          currentStock: item.currentStock,
        });
      }

      // Siapkan data carry-over untuk bulan depan
      nextPeriodInventories.push({
        productId: item.productId,
        initialStock: item.currentStock, // Sisa stok akhir bulan ini menjadi stok awal bulan depan
        addedStock: 0,
        currentStock: item.currentStock, // Stok berjalan awal diset sama dengan stok awal
        status: INVENTORY_STATUS.ACTIVE,
        period: nextPeriod,
      });
    }

    // Jalankan transaksi Prisma secara atomik
    const result = await ClosingRepository.executeClosingTransaction({
      currentPeriod: period,
      nextPeriod,
      totalRevenue: previewData.summary.totalRevenue,
      totalCapital: previewData.summary.totalCapital,
      netProfit: previewData.summary.netProfit,
      closedById,
      inventoryUpdates,
      nextPeriodInventories,
    });

    return {
      message: `Closing bulan ${period} berhasil dieksekusi. Stok berhasil dibawa ke periode ${nextPeriod}.`,
      data: result,
    };
  },
};