import { z } from "zod";

export const createTransactionSchema = z.object({
  productId: z.uuid("ID produk tidak valid"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
  quantity: z.number().int().positive("Kuantitas terjual harus lebih dari 0"),
  costPrice: z.number().nonnegative("Harga modal tidak boleh negatif"),
  sellingPrice: z.number().nonnegative("Harga jual tidak boleh negatif"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;