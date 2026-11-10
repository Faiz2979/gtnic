// src/server/routers/closing/closing.repository.ts
import { prisma } from "@/lib/prisma";
import { CLOSING_STATUS } from "@/utils/enums/closing-status.enum";
import { ClosingItemSnapshot } from "@/utils/types/item-closing.types";
import { InventoryStatus } from "../../../../lib/generated/prisma";

export const ClosingRepository = {
  // Mengambil inventaris aktif pada periode tertentu (misal: "2026-10")
  getActiveInventories: async (period: string) => {
    return await prisma.monthlyInventory.findMany({
      where: { period, status: InventoryStatus.ACTIVE },
      include: { product: true },
    });
  },

  // Mengambil transaksi berdasarkan field period langsung di tabel transactions
  getTransactionsByPeriod: async (period: string) => {
    return await prisma.transaction.findMany({
      where: { period },
    });
  },

  // Eksekusi transaksi Prisma secara atomik untuk proses closing
  executeClosingTransaction: async (params: {
    currentPeriod: string;
    nextPeriod: string;
    totalRevenue: number;
    totalCapital: number;
    netProfit: number;
    closedById: string;
    inventoryUpdates: { id: string; currentStock: number }[];
    nextPeriodInventories: {
      productId: string;
      initialStock: number;
      addedStock: number;
      currentStock: number;
      status: InventoryStatus;
      period: string;
    }[];
  }) => {
    const {
      currentPeriod,
      nextPeriod,
      totalRevenue,
      totalCapital,
      netProfit,
      closedById,
      inventoryUpdates,
      nextPeriodInventories,
    } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Ubah status inventaris periode lama menjadi CLOSED & pastikan sisa stok final tersimpan
      for (const inv of inventoryUpdates) {
        await tx.monthlyInventory.update({
          where: { id: inv.id },
          data: {
            status: InventoryStatus.CLOSED,
            currentStock: inv.currentStock
          },
        });
      }

      // 2. Simpan rekapitulasi ke tabel monthly_closings beserta ID Owner yang menutup buku
      const closingRecord = await tx.monthlyClosing.create({
        data: {
          period: currentPeriod,
          totalRevenue,
          totalCapital,
          netProfit,
          closedById,
        },
      });

      // 3. Generate carry-over stok awal untuk periode berikutnya
      await tx.monthlyInventory.createMany({
        data: nextPeriodInventories,
        skipDuplicates: true,
      });

      return closingRecord;
    });
  },

  upsertDraftClosingWithSnapshot: async (data: {
    period: string;
    totalRevenue: number;
    totalCapital: number;
    netProfit: number;
    items: ClosingItemSnapshot[];
  }) => {
    return await prisma.monthlyClosing.upsert({
      where: { period: data.period },
      update: {
        totalRevenue: data.totalRevenue,
        totalCapital: data.totalCapital,
        netProfit: data.netProfit,
        status: CLOSING_STATUS.DRAFT,
        itemsSnapshot: data.items as any, // Prisma menerima objek JSON ke kolom Json
      },
      create: {
        period: data.period,
        totalRevenue: data.totalRevenue,
        totalCapital: data.totalCapital,
        netProfit: data.netProfit,
        status: CLOSING_STATUS.DRAFT,
        itemsSnapshot: data.items as any,
      },
    });
  },

  // Mengambil data draf closing berdasarkan periode
  getByPeriod: async (period: string) => {
    return await prisma.monthlyClosing.findUnique({
      where: { period },
    });
  },

  // Mengambil seluruh riwayat closing untuk arsip/laporan
  getAllClosings: async () => {
    return await prisma.monthlyClosing.findMany({
      orderBy: { period: "desc" },
      include: {
        closedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  // Memperbarui snapshot item (misal saat staf mengubah stok fisik / mencatat selisih)
  updateItemsSnapshot: async (period: string, newItems: ClosingItemSnapshot[]) => {
    return await prisma.monthlyClosing.update({
      where: { period },
      data: {
        itemsSnapshot: newItems as any,
      },
    });
  },
};