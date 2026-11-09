// src/server/routers/transaction/transaction.actions.ts
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../lib/generated/prisma";
import { CreateTransactionInput } from "./transaction.dto";
import { transactionRepository } from "./transaction.repository";

export const transactionAction = {
  async createTransaction(input: CreateTransactionInput, userId: string) {
    const { productId, period, quantity, costPrice, sellingPrice } = input;

    const dCostPrice = new Prisma.Decimal(costPrice);
    const dSellingPrice = new Prisma.Decimal(sellingPrice);
    
    const profitPerUnit = dSellingPrice.minus(dCostPrice);
    const totalProfit = profitPerUnit.times(quantity);

    return await prisma.$transaction(async () => {
      const inventory = await transactionRepository.findInventory(productId, period);

      if (!inventory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Inventoris untuk produk ini pada periode ${period} tidak ditemukan.`,
        });
      }

      if (inventory.status === "CLOSED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tidak dapat menambah transaksi pada periode yang sudah di-closing (CLOSED).",
        });
      }

      // 3. Validasi Out-of-Stock (Cek kecukupan stok)
      if (inventory.currentStock < quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Stok tidak mencukupi! Sisa stok saat ini: ${inventory.currentStock}, diminta: ${quantity}.`,
        });
      }

      // 4. Simpan record transaksi menggunakan repository
      const transaction = await transactionRepository.createTransaction(
        input,
        totalProfit,
        userId
      );

      // 5. Kurangi stok berjalan pada inventory
      await transactionRepository.decrementStock(inventory.id, quantity);

      return transaction;
    });
  },

  async getAllTransactions(period: string) {
    return await transactionRepository.findAllByPeriod(period);
  },
};