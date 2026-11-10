import { prisma } from "@/lib/prisma";
import { CLOSING_STATUS } from "@/utils/enums/closing-status.enum";
import { ClosingItemSnapshot } from "@/utils/types/item-closing.types";
import dayjs from "dayjs";
import { InventoryStatus, Prisma } from "../../../../lib/generated/prisma";
import { ClosingRepository } from "./closing.repository";

export const ClosingActions = {
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

    const initialItemsSnapshot: ClosingItemSnapshot[] = inventories.map((inv) => ({
      productId: inv.productId,
      productName: inv.product.name,
      systemStock: inv.currentStock,
      physicalStock: inv.currentStock, 
      discrepancy: 0, 
      notes: null,
    }));

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

    const items = (closingRecord.itemsSnapshot as unknown as ClosingItemSnapshot[]) || [];

    const targetItemIndex = items.findIndex((item) => item.productId === params.productId);
    if (targetItemIndex === -1) {
      throw new Error("Produk tidak ditemukan dalam draf closing ini.");
    }

    const systemStock = items[targetItemIndex].systemStock;
    const discrepancy = params.physicalStock - systemStock;

    items[targetItemIndex] = {
      ...items[targetItemIndex],
      physicalStock: params.physicalStock,
      discrepancy,
      notes: params.notes || null,
    };

    return await ClosingRepository.updateItemsSnapshot(params.period, items);
  },

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
          currentStock: item.physicalStock, 
        });
      }

      nextPeriodInventories.push({
        productId: item.productId,
        initialStock: item.physicalStock,
        addedStock: 0,
        currentStock: item.physicalStock,
        status: InventoryStatus.ACTIVE,
        period: nextPeriod,
      });
    }

    return await prisma.$transaction(async (tx) => {
      for (const inv of inventoryUpdates) {
        await tx.monthlyInventory.update({
          where: { id: inv.id },
          data: {
            status: InventoryStatus.CLOSED,
            currentStock: inv.currentStock,
          },  
        });
      }

      const updatedClosingRecord = await tx.monthlyClosing.update({
        where: { period },
        data: {
          status: CLOSING_STATUS.CLOSED,
          closedById,
          closedAt: new Date(),
          totalRevenue: closingRecord.totalRevenue,
          totalCapital: closingRecord.totalCapital,
          netProfit: closingRecord.netProfit,
          itemsSnapshot: items as unknown as Prisma.JsonObject,
        },
      });

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