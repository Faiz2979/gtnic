import { sendClosingReportEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { CLOSING_STATUS } from "@/utils/enums/closing-status.enum";
import { ClosingItemSnapshot } from "@/utils/types/item-closing.types";
import dayjs from "dayjs";
import { InventoryStatus, Prisma } from "../../../../lib/generated/prisma";
import { ClosingRepository } from "./closing.repository";

export const ClosingActions = {
  generateDraft: async (period: string) => {
    let inventories = await ClosingRepository.getActiveInventories(period);
    
    // Jika belum ada inventaris aktif pada periode ini, inisialisasi dari katalog produk yang ada
    if (!inventories.length) {
      const allProducts = await prisma.product.findMany();
      if (allProducts.length > 0) {
        await prisma.monthlyInventory.createMany({
          data: allProducts.map((p) => ({
            productId: p.id,
            period,
            initialStock: 0,
            addedStock: 0,
            currentStock: 0,
            status: InventoryStatus.ACTIVE,
          })),
          skipDuplicates: true,
        });
        inventories = await ClosingRepository.getActiveInventories(period);
      }
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

  executeClosing: async (period: string, closedById: string): Promise<{ message: string; success: boolean }> => {
    let closingRecord = await ClosingRepository.getByPeriod(period);
    if (!closingRecord) {
      // Jika belum ada draf, generate draf terlebih dahulu
      const draftResult = await ClosingActions.generateDraft(period);
      closingRecord = draftResult.draft;
    }

    if (closingRecord?.status === CLOSING_STATUS.CLOSED) {
      throw new Error(`Periode ${period} sudah ditutup sebelumnya.`);
    }

    let activeInventories = await ClosingRepository.getActiveInventories(period);
    if (!activeInventories.length) {
      const allProducts = await prisma.product.findMany();
      if (allProducts.length > 0) {
        await prisma.monthlyInventory.createMany({
          data: allProducts.map((p) => ({
            productId: p.id,
            period,
            initialStock: 0,
            addedStock: 0,
            currentStock: 0,
            status: InventoryStatus.ACTIVE,
          })),
          skipDuplicates: true,
        });
        activeInventories = await ClosingRepository.getActiveInventories(period);
      }
    }

    const items: ClosingItemSnapshot[] =
      (closingRecord?.itemsSnapshot as unknown as ClosingItemSnapshot[]) ||
      activeInventories.map((inv) => ({
        productId: inv.productId,
        productName: inv.product.name,
        systemStock: inv.currentStock,
        physicalStock: inv.currentStock,
        discrepancy: 0,
        notes: null,
      }));

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

    const transactions = await ClosingRepository.getTransactionsByPeriod(period);
    let calcRevenue = 0;
    let calcCapital = 0;
    let calcProfit = 0;
    for (const trx of transactions) {
      const qty = trx.quantity;
      calcRevenue += qty * Number(trx.sellingPrice);
      calcCapital += qty * Number(trx.costPrice);
      calcProfit += Number(trx.totalProfit);
    }

    const finalRevenue = closingRecord?.totalRevenue ? Number(closingRecord.totalRevenue) : calcRevenue;
    const finalCapital = closingRecord?.totalCapital ? Number(closingRecord.totalCapital) : calcCapital;
    const finalProfit = closingRecord?.netProfit ? Number(closingRecord.netProfit) : calcProfit;

    // Jalankan transaksi Prisma secara atomik
    await prisma.$transaction(async (tx) => {
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

      await tx.monthlyInventory.updateMany({
        where: { period, status: InventoryStatus.ACTIVE },
        data: { status: InventoryStatus.CLOSED },
      });

      // B. Update status MonthlyClosing menjadi CLOSED via upsert agar aman
      await tx.monthlyClosing.upsert({
        where: { period },
        update: {
          status: CLOSING_STATUS.CLOSED,
          closedById,
          closedAt: new Date(),
          totalRevenue: finalRevenue,
          totalCapital: finalCapital,
          netProfit: finalProfit,
          itemsSnapshot: items as unknown as Prisma.JsonObject,
        },
        create: {
          period,
          status: CLOSING_STATUS.CLOSED,
          closedById,
          closedAt: new Date(),
          totalRevenue: finalRevenue,
          totalCapital: finalCapital,
          netProfit: finalProfit,
          itemsSnapshot: items as unknown as Prisma.JsonObject,
        },
      });

      // C. Carry-over stok awal untuk periode berikutnya via upsert individual
      for (const inv of nextPeriodInventories) {
        await tx.monthlyInventory.upsert({
          where: {
            productId_period: {
              productId: inv.productId,
              period: nextPeriod,
            },
          },
          update: {
            initialStock: inv.initialStock,
            currentStock: inv.currentStock,
            status: InventoryStatus.ACTIVE,
          },
          create: {
            productId: inv.productId,
            period: nextPeriod,
            initialStock: inv.initialStock,
            addedStock: 0,
            currentStock: inv.currentStock,
            status: InventoryStatus.ACTIVE,
          },
        });
      }
    });

    // D. Kirim email notifikasi secara asynchronous (tidak memblokir respon HTTP)
    try {
      const ownerProfile = await prisma.profile.findUnique({
        where: { id: closedById },
      });
      if (ownerProfile?.email) {
        sendClosingReportEmail({
          to: ownerProfile.email,
          period,
          totalRevenue: finalRevenue,
          totalCapital: finalCapital,
          netProfit: finalProfit,
          closedByName: ownerProfile.fullName || "Owner",
          nextPeriod,
          itemsCount: items.length,
        }).catch((emailErr) => {
          console.warn("Background email sending warning:", emailErr);
        });
      }
    } catch (emailErr) {
      console.warn("Gagal inisialisasi email closing:", emailErr);
    }

    return {
      message: `Closing bulan ${period} sukses dieksekusi. Stok riil diteruskan ke periode ${nextPeriod}.`,
      success: true,
    };
  },

  // 4. Preview Kalkulasi Bulanan Sebelum Eksekusi Closing
  getPreview: async (period: string) => {
    let closingRecord = await ClosingRepository.getByPeriod(period);
    if (!closingRecord) {
      try {
        const draftResult = await ClosingActions.generateDraft(period);
        closingRecord = draftResult.draft;
      } catch (err) {
        console.log("Gagal generate draf untuk preview:", err);
        // Abaikan jika inventaris belum aktif
      }
    }

    const transactions = await ClosingRepository.getTransactionsByPeriod(period);
    const inventories = await ClosingRepository.getActiveInventories(period);

    let totalRevenue = 0;
    let totalCapital = 0;
    let totalProfit = 0;
    let totalQuantity = 0;

    for (const trx of transactions) {
      const qty = trx.quantity;
      totalRevenue += qty * Number(trx.sellingPrice);
      totalCapital += qty * Number(trx.costPrice);
      totalProfit += Number(trx.totalProfit);
      totalQuantity += qty;
    }

    const items: ClosingItemSnapshot[] =
      (closingRecord?.itemsSnapshot as unknown as ClosingItemSnapshot[]) ||
      inventories.map((inv) => ({
        productId: inv.productId,
        productName: inv.product.name,
        systemStock: inv.currentStock,
        physicalStock: inv.currentStock,
        discrepancy: 0,
        notes: null,
      }));

    const nextPeriod = dayjs(`${period}-01`).add(1, "month").format("YYYY-MM");

    return {
      period,
      nextPeriod,
      status: closingRecord?.status ?? CLOSING_STATUS.DRAFT,
      totalRevenue: Number(closingRecord?.totalRevenue ?? totalRevenue),
      totalCapital: Number(closingRecord?.totalCapital ?? totalCapital),
      netProfit: Number(closingRecord?.netProfit ?? totalProfit),
      transactionCount: transactions.length,
      totalQuantitySold: totalQuantity,
      items,
      isClosed: closingRecord?.status === CLOSING_STATUS.CLOSED,
      closedAt: closingRecord?.closedAt ?? null,
    };
  },

  getAllClosings: async () => {
    const records = await ClosingRepository.getAllClosings();
    return records.map((c: any) => ({
      id: c.id,
      period: c.period,
      totalRevenue: Number(c.totalRevenue),
      totalCapital: Number(c.totalCapital),
      netProfit: Number(c.netProfit),
      status: c.status as string,
      closedAt: c.closedAt ? c.closedAt.toISOString() : null,
      itemsSnapshot: (c.itemsSnapshot as unknown as ClosingItemSnapshot[]) || [],
      closedBy: c.closedBy
        ? {
            id: c.closedBy.id,
            fullName: c.closedBy.fullName,
            email: c.closedBy.email,
            role: c.closedBy.role,
          }
        : null,
    }));
  },

  // 6. Membuka Kembali Periode Closing (Reopen Period Khusus Owner)
  reopenClosing: async (period: string) => {
    return await prisma.$transaction(async (tx) => {
      await tx.monthlyClosing.update({
        where: { period },
        data: {
          status: CLOSING_STATUS.DRAFT,
        },
      });

      await tx.monthlyInventory.updateMany({
        where: { period },
        data: {
          status: InventoryStatus.ACTIVE,
        },
      });

      return {
        success: true,
        message: `Periode ${period} berhasil dibuka kembali (Reopened). Anda dan staf kini dapat kembali mencatat transaksi.`,
      };
    });
  },
};