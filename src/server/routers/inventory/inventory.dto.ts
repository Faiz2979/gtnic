import { z } from "zod";

export const addStockSchema = z.object({
  productId: z.uuid("ID produk tidak valid"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
  quantity: z.number().int().positive("Jumlah stok harus lebih dari 0"),
});
