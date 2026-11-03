import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createProductSchema, updateProductSchema } from "./product.dto";
import { productRepository } from "./product.repository";

export const productActions = {
    async getAllProducts() {
        return await productRepository.findAll();
    },

    async getProductById(id: string) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Produk tidak ditemukan",
            });
        }
        return product;
    },

    async createProduct(input: z.infer<typeof createProductSchema>) {
        // Cek duplikasi nama produk
        const existing = await productRepository.findByName(input.name);
        if (existing) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Produk dengan nama tersebut sudah ada",
            });
        }

        return await productRepository.create({
            name: input.name,
            imageLink: input.imageLink ?? "",
            initialStock: input.initialStock,
            defaultCost: input.defaultCost,
            defaultPrice: input.defaultPrice,
        });
    },

    async updateProduct(input: z.infer<typeof updateProductSchema>) {
        const { id, ...data } = input;

        await this.getProductById(id); // Pastikan produk ada

        // Jika nama diubah, cek apakah konflik dengan produk lain
        if (data?.name) {
            const existing = await productRepository.findByName(data.name);
            if (existing && existing.id !== id) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Nama produk sudah digunakan oleh produk lain",
                });
            }
        }

        return await productRepository.update(
            id,
            data as Parameters<typeof productRepository.update>[1],
        );
    },

    async deleteProduct(id: string) {
        await this.getProductById(id); // Pastikan produk ada

        try {
            await productRepository.delete(id);
            return {
                message: "Produk berhasil dihapus",
            } 
        } catch {
            // Terjadi error jika produk berelasi dengan transaksi/inventaris (Foreign Key Constraint)
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "Produk tidak dapat dihapus karena memiliki riwayat transaksi atau inventaris",
            });
        }
    }
}