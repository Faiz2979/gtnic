import z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  defaultCost: z.number().positive("Harga modal harus bernilai positif"),
  defaultPrice: z.number().positive("Harga jual harus bernilai positif"),
});

export const updateProductSchema = z.object({
  id: z.uuid("ID produk tidak valid"),
  ...createProductSchema.partial().shape,
});