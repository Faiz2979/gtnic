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