import { z } from "zod";

export const BillTypeEnum = z.enum(["RECEIVABLE", "PAYABLE"]);
export const BillStatusEnum = z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE"]);

export const BillItemSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  quantity: z.number().min(1, "Jumlah minimal 1"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
});

export const createBillSchema = z.object({
  invoiceNumber: z.string().optional(),
  title: z.string().min(1, "Judul / Perihal tagihan wajib diisi"),
  contactName: z.string().min(1, "Nama pelanggan atau supplier wajib diisi"),
  contactPhone: z.string().optional().nullable(),
  type: BillTypeEnum.default("RECEIVABLE"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  items: z.array(BillItemSchema).min(1, "Minimal masukkan 1 item tagihan"),
  notes: z.string().optional().nullable(),
});

export const recordPaymentSchema = z.object({
  billId: z.string().uuid("ID tagihan tidak valid"),
  accountId: z.string().uuid("ID rekening tidak valid"),
  amount: z.number().positive("Nominal pembayaran harus lebih dari 0"),
  paymentDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const updateBillStatusSchema = z.object({
  id: z.string().uuid("ID tagihan tidak valid"),
  status: BillStatusEnum,
});

export const deleteBillSchema = z.object({
  id: z.string().uuid("ID tagihan tidak valid"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type BillItemInput = z.infer<typeof BillItemSchema>;

