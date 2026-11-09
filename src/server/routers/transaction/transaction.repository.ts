// src/server/routers/transaction/transaction.repository.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../lib/generated/prisma";
import { CreateTransactionInput } from "./transaction.dto";

export const transactionRepository = {
    async findInventory(productId: string, period: string) {
        return await prisma.monthlyInventory.findUnique({
            where: {
                productId_period: {
                    productId,
                    period,
                },
            },
        });
    },

    async createTransaction(data: CreateTransactionInput, totalProfit: Prisma.Decimal, createdById: string) {
        return await prisma.transaction.create({
            data: {
                productId: data.productId,
                period: data.period,
                quantity: data.quantity,
                costPrice: data.costPrice,
                sellingPrice: data.sellingPrice,
                createdById: createdById,
                totalProfit: totalProfit,
            },
            include: {
                product: true,
            },
        });
    },

    async decrementStock(inventoryId: string, quantity: number) {
        return await prisma.monthlyInventory.update({
            where: { id: inventoryId },
            data: {
                currentStock: {
                    decrement: quantity,
                },
            },
        });
    },

    async findAllByPeriod(period?: string) {
        return await prisma.transaction.findMany({
            where: period && period !== "ALL" ? { period } : undefined,
            include: {
                product: true,
                createdBy: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getDistinctPeriods() {
        const records = await prisma.transaction.findMany({
            select: { period: true },
            distinct: ["period"],
            orderBy: { period: "desc" },
        });
        return records.map((r) => r.period);
    },
};