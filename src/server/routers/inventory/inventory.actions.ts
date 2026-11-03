import { INVENTORY_STATUS } from "@/utils/enums/inventory-status.enum";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { addStockSchema } from "./inventory.dto";
import { inventoryRepository } from "./inventory.repository";

export const inventoryActions = {
  async addStock(input: z.infer<typeof addStockSchema>) {
    const { productId, period, quantity } = input;

    const inventory = await inventoryRepository.findInventory(productId, period);

    if (!inventory) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Inventoris untuk produk tersebut pada periode ${period} tidak ditemukan.`,
      });
    }

    if (inventory.status === INVENTORY_STATUS.CLOSED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tidak dapat menambah stok pada periode yang sudah di-closing (CLOSED).",
      });
    }

    // 3. Tambah added_stock dan current_stock secara atomic
    const updatedInventory = await inventoryRepository.updateAddedStock(
      inventory.id,
      quantity
    );

    return updatedInventory;
  },
};