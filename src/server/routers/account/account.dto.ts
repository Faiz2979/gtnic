import { z } from "zod";

export const AccountTypeEnum = z.enum(["BANK", "EWALLET", "CASH"]);
export const MutationTypeEnum = z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]);

export const createAccountSchema = z.object({
    name: z.string().min(1, "Nama label rekening wajib diisi"),
    bankName: z.string().min(1, "Nama bank atau metode pembayaran wajib diisi"),
    accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
    holderName: z.string().min(1, "Nama pemilik rekening wajib diisi"),
    type: AccountTypeEnum.default("BANK"),
    balance: z.number().min(0, "Saldo awal tidak boleh negatif").default(0),
    isActive: z.boolean().default(true),
    isPrimary: z.boolean().default(false),
    notes: z.string().optional().nullable(),
});

export const updateAccountSchema = z.object({
    id: z.string().uuid("ID rekening tidak valid"),
    name: z.string().min(1, "Nama label rekening wajib diisi").optional(),
    bankName: z.string().min(1, "Nama bank wajib diisi").optional(),
    accountNumber: z.string().min(1, "Nomor rekening wajib diisi").optional(),
    holderName: z.string().min(1, "Nama pemilik rekening wajib diisi").optional(),
    type: AccountTypeEnum.optional(),
    balance: z.number().min(0, "Saldo tidak boleh negatif").optional(),
    isActive: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
    notes: z.string().optional().nullable(),
});

export const adjustBalanceSchema = z.object({
    accountId: z.string().uuid("ID rekening tidak valid"),
    type: z.enum(["INCOME", "EXPENSE", "ADJUSTMENT"]),
    amount: z.number().positive("Nominal harus lebih dari 0"),
    description: z.string().min(1, "Keterangan penyesuaian wajib diisi"),
    reference: z.string().optional().nullable(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;

