// src/server/routers/product/product.repository.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../lib/generated/prisma";

export const productRepository = {
  async findAll() {
    return await prisma.product.findMany({
      orderBy: { name: "asc" },
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

  async create(data: Prisma.ProductCreateInput) {
    return await prisma.product.create({
      data,
    });
  },

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return await prisma.product.delete({
      where: { id },
    });
  }
}