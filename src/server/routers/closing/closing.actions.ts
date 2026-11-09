// src/server/routers/closing/closing.actions.ts
import { prisma } from "@/lib/prisma";
import { CLOSING_STATUS } from "@/utils/enums/closing-status.enum";
import { ClosingItemSnapshot } from "@/utils/types/item-closing.types";
import dayjs from "dayjs";
import { InventoryStatus } from "../../../../lib/generated/prisma";
import { ClosingRepository } from "./closing.repository";

export const ClosingActions = {
  // 1. Preview atau Generate Draf Closing (Dipicu otomatis oleh Cron Scheduler atau manual)
  generateDraft: async (period: string) => {
    const inventories = await ClosingRepository.getActiveInventories(period);
    
    if (!inventories.length) {
      throw new Error(`Tidak ada inventaris aktif untuk periode ${period}`);
    }

    const transactions = await ClosingRepository.getTransactionsByPeriod(period);

    let totalRevenue = 0;
    let totalCapital = 0;
    let totalProfit = 0;

    for (const trx of transactions) {
      const qty = trx.quantity;
      totalRevenue += qty * Number(trx.sellingPrice);
      totalCapital += qty * Number(trx.costPrice);
      totalProfit += Number(trx.totalProfit);
    }

    // Buat snapshot item awal (Stok fisik default disamakan dengan stok sistem)
    const initialItemsSnapshot: ClosingItemSnapshot[] = inventories.map((inv) => ({
      productId: inv.productId,
      productName: inv.product.name,
      systemStock: inv.currentStock,
      physicalStock: inv.currentStock, // Default awal sama dengan sistem
      discrepancy: 0,                   // Belum ada selisih
      notes: null,
    }));

    // Simpan atau update draf ke database dalam bentuk JSONB
    const savedDraft = await ClosingRepository.upsertDraftClosingWithSnapshot({
      period,
      totalRevenue,
      totalCapital,
      netProfit: totalProfit,
      items: initialItemsSnapshot,
    });

    return {
      message: `Draf closing periode ${period} berhasil digenerate.`,
      draft: savedDraft,
    };
  },

  // 2. Aksi Staf: Memperbarui Stok Fisik & Mencatat Selisih (Kurang/Lebih)
  updateStaffStockOpname: async (params: {
    period: string;
    productId: string;
    physicalStock: number;
    notes?: string;
  }) => {
    const closingRecord = await ClosingRepository.getByPeriod(params.period);
    if (!closingRecord) {
      throw new Error(`Draf closing untuk periode ${params.period} tidak ditemukan.`);
    }

    if (closingRecord.status === CLOSING_STATUS.CLOSED) {
      throw new Error(`Periode ${params.period} sudah ditutup, tidak dapat mengubah opname.`);
    }

    // Ambil array snapshot yang ada di kolom JSONB
    const items = (closingRecord.itemsSnapshot as unknown as ClosingItemSnapshot[]) || [];

    // Cari item produk yang ingin di-update
    const targetItemIndex = items.findIndex((item) => item.productId === params.productId);
    if (targetItemIndex === -1) {
      throw new Error("Produk tidak ditemukan dalam draf closing ini.");
    }

    // Hitung selisih (discrepancy): Stok Fisik - Stok Sistem
    // Negatif jika kurang (hilang/rusak), Positif jika lebih (kelebihan stok)
    const systemStock = items[targetItemIndex].systemStock;
    const discrepancy = params.physicalStock - systemStock;

    // Update data item tersebut di dalam array
    items[targetItemIndex] = {
      ...items[targetItemIndex],
      physicalStock: params.physicalStock,
      discrepancy,
      notes: params.notes || null,
    };

    // Simpan kembali array JSONB yang sudah diperbarui ke database
    return await ClosingRepository.updateItemsSnapshot(params.period, items);
  },

  // 3. Eksekusi Final oleh Owner (Carry-over stok riil ke bulan depan & ubah status jadi CLOSED)
  executeClosing: async (period: string, closedById: string) => {
    const closingRecord = await ClosingRepository.getByPeriod(period);
    if (!closingRecord) {
      throw new Error(`Data closing periode ${period} tidak ditemukan.`);
    }
    if (closingRecord.status === CLOSING_STATUS.CLOSED) {
      throw new Error(`Periode ${period} sudah ditutup sebelumnya.`);
    }

    const items = (closingRecord.itemsSnapshot as unknown as ClosingItemSnapshot[]) || [];
    const nextPeriod = dayjs(`${period}-01`).add(1, "month").format("YYYY-MM");

    const inventoryUpdates: {
      id: string;
      // Menggunakan stok fisik hasil opname staf, bukan lagi stok sistem mentah
      currentStock: number;
    }[] = [];
    const nextPeriodInventories: { 
      productId: string; 
      initialStock: number; 
      addedStock: number; 
      currentStock: number; 
      status: "ACTIVE"; 
      period: string; 
    }[] = [];

    for (const item of items) {
      const activeInventories = await ClosingRepository.getActiveInventories(period);
      const target = activeInventories.find((i) => i.productId === item.productId);

      if (target) {
        inventoryUpdates.push({
          id: target.id,
          // Menggunakan stok fisik hasil opname staf, bukan lagi stok sistem mentah
          currentStock: item.physicalStock, 
        });
      }

      // Siapkan carry-over stok awal untuk periode berikutnya berdasarkan hasil verifikasi fisik
      nextPeriodInventories.push({
        productId: item.productId,
        initialStock: item.physicalStock,
        addedStock: 0,
        currentStock: item.physicalStock,
        status: InventoryStatus.ACTIVE,
        period: nextPeriod,
      });
    }

    // Jalankan transaksi Prisma secara atomik
    return await prisma.$transaction(async (tx) => {
      // A. Update status inventaris lama menjadi CLOSED & simpan stok final fisik
      for (const inv of inventoryUpdates) {
        await tx.monthlyInventory.update({
          where: { id: inv.id },
          data: {
            status: InventoryStatus.CLOSED,
            currentStock: inv.currentStock,
          },  
        });
      }

      // B. Update status MonthlyClosing menjadi CLOSED, lengkapi data Owner yang menutup buku, dan update status snapshot akhir
      const updatedClosingRecord = await tx.monthlyClosing.update({
        where: { period },
        data: {
          status: CLOSING_STATUS.CLOSED,
          closedById,
          closedAt: new Date(),
          totalRevenue: closingRecord.totalRevenue,
          totalCapital: closingRecord.totalCapital,
          netProfit: closingRecord.netProfit,
          itemsSnapshot: items as any,
        },
      });

      // C. Generate carry-over stok awal untuk periode berikutnya
      await tx.monthlyInventory.createMany({
        data: nextPeriodInventories,
        skipDuplicates: true,
      });

      return {
        message: `Closing bulan ${period} sukses dieksekusi. Stok riil diteruskan ke periode ${nextPeriod}.`,
        data: updatedClosingRecord,
      };
    });
  },
};