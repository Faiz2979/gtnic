import { prisma } from "@/lib/prisma";

export const inventoryRepository = {
  async findInventory(productId: string, period: string) {
    return prisma.monthlyInventory.findUnique({
      where: {
        productId_period: {
          productId: productId,
          period,
        },
      },
    });
  },

  async createInventory(data: {
    productId: string;
    period: string;
    initialStock: number;
    addedStock: number;
    currentStock: number;
  }) {
    return prisma.monthlyInventory.create({
      data: {
        ...data,
        status: "ACTIVE",
      },
    });
  },

  async updateAddedStock(inventoryId: string, addedQuantity: number) {
    return prisma.monthlyInventory.update({
      where: { id: inventoryId },
      data: {
        addedStock: { increment: addedQuantity },
        currentStock: { increment: addedQuantity },
      },
    });
  },
};