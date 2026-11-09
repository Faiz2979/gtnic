import z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  imageLink: z.string().url("Link gambar tidak valid").optional().or(z.literal("")),
  defaultCost: z.number().positive("Harga modal harus bernilai positif"),
  defaultPrice: z.number().positive("Harga jual harus bernilai positif"),
  initialStock: z.number().int("Stok awal harus berupa bilangan bulat").nonnegative("Stok awal tidak boleh negatif"),
});

export const updateProductSchema = z.object({
  id: z.uuid("ID produk tidak valid"),
  ...createProductSchema.partial().shape,
});