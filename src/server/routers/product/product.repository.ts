// src/server/routers/product/product.repository.ts
import { prisma } from "@/lib/prisma";
import dayjs from 'dayjs';
import z from "zod";
import { createProductSchema } from "./product.dto";

export const productRepository = {
  async findAll() {
    return await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      const currentPeriod = dayjs().format('YYYY-MM');

      const productsWithInventory = await Promise.all(
        products.map(async (product) => {
          const inventory = await tx.monthlyInventory.findFirst({
            where: {
              productId: product.id,
              period: currentPeriod,
            },
          });

          return {
            ...product,
            initialStock: inventory?.initialStock ?? 0,
            addedStock: inventory?.addedStock ?? 0,
            currentStock: inventory?.currentStock ?? 0,
          };
        })
      );

      return productsWithInventory;
    });
  },

  async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
    });
  },

  async findByName(name: string) {
    return await prisma.product.findUnique({
      where: { name },
    });
  },

  async create(data: z.infer<typeof createProductSchema>) {
    const currentPeriod = dayjs().format('YYYY-MM');

    const result = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          defaultCost: data.defaultCost,
          defaultPrice: data.defaultPrice,
          imageLink: data.imageLink ?? '',
        },
      });

      const newInventory = await tx.monthlyInventory.create({
        data: {
          productId: newProduct.id,
          period: currentPeriod,
          initialStock: data.initialStock,
          addedStock: 0,
          currentStock: data.initialStock,
          status: 'ACTIVE',
        },
      });

      return { product: newProduct, inventory: newInventory };
    });

    return result;
  },

  async update(id: string, data: Partial<z.infer<typeof createProductSchema>>) {
    try {
      const { initialStock, ...productData } = data;

      return await prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: {
            ...productData,
            updatedAt: new Date(),
          },
        });

        // Jika stok awal diubah, update juga stok di monthlyInventory untuk periode saat ini
        if (initialStock !== undefined) {
          const currentPeriod = dayjs().format('YYYY-MM');
          const inv = await tx.monthlyInventory.findFirst({
            where: {
              productId: id,
              period: currentPeriod,
            },
          });

          if (inv) {
            await tx.monthlyInventory.update({
              where: { id: inv.id },
              data: {
                initialStock: initialStock,
                currentStock: initialStock + (inv.addedStock || 0),
              },
            });
          } else {
            await tx.monthlyInventory.create({
              data: {
                productId: id,
                period: currentPeriod,
                initialStock: initialStock,
                addedStock: 0,
                currentStock: initialStock,
                status: 'ACTIVE',
              },
            });
          }
        }

        return updatedProduct;
      });
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
      // Hapus semua monthlyInventory terkait produk ini
      await tx.monthlyInventory.deleteMany({
        where: { productId: id },
      });

      // Hapus produk itu sendiri
      return await tx.product.delete({
        where: { id },
      });
    });
  }
}