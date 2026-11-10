import { prisma } from "@/lib/prisma";
import { AccountType, MutationType } from "../../../../lib/generated/prisma";
import { CreateAccountInput, UpdateAccountInput } from "./account.dto";

export const accountRepository = {
    async getAll() {
        return await prisma.bankAccount.findMany({
            orderBy: [
                { isPrimary: "desc" },
                { createdAt: "asc" },
            ],
            include: {
                mutations: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    },

    async count() {
        return await prisma.bankAccount.count();
    },

    async getById(id: string) {
        return await prisma.bankAccount.findUnique({
            where: { id },
            include: {
                mutations: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    },

    async create(data: CreateAccountInput, createdById?: string) {
        if (data.isPrimary) {
            await prisma.bankAccount.updateMany({
                data: { isPrimary: false },
            });
        }

        const created = await prisma.bankAccount.create({
            data: {
                name: data.name,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                holderName: data.holderName,
                type: data.type as AccountType,
                balance: data.balance,
                isActive: data.isActive ?? true,
                isPrimary: data.isPrimary ?? false,
                notes: data.notes,
                createdById: createdById ?? null,
            },
        });

        // Record initial balance mutation if balance > 0
        if (data.balance > 0) {
            await prisma.accountMutation.create({
                data: {
                    accountId: created.id,
                    type: MutationType.ADJUSTMENT,
                    amount: data.balance,
                    description: "Saldo Awal Pembukaan Rekening",
                },
            });
        }

        return created;
    },

    async update(id: string, data: Partial<UpdateAccountInput>) {
        if (data.isPrimary) {
            await prisma.bankAccount.updateMany({
                where: { id: { not: id } },
                data: { isPrimary: false },
            });
        }

        return await prisma.bankAccount.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.bankName !== undefined && { bankName: data.bankName }),
                ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
                ...(data.holderName !== undefined && { holderName: data.holderName }),
                ...(data.type !== undefined && { type: data.type as AccountType }),
                ...(data.balance !== undefined && { balance: data.balance }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
                ...(data.notes !== undefined && { notes: data.notes }),
            },

        });
    },

    async delete(id: string) {
        return await prisma.bankAccount.delete({
            where: { id },
        });
    },

    async recordMutation(params: {
        accountId: string;
        type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
        amount: number;
        description: string;
        reference?: string | null;
    }) {
        const account = await prisma.bankAccount.findUnique({
            where: { id: params.accountId },
        });

        if (!account) {
            throw new Error("Rekening tidak ditemukan");
        }

        const currentBalance = Number(account.balance);
        let newBalance = currentBalance;

        if (params.type === "INCOME") {
            newBalance = currentBalance + params.amount;
        } else if (params.type === "EXPENSE") {
            if (currentBalance < params.amount) {
                throw new Error("Saldo tidak mencukupi untuk penarikan/pengeluaran");
            }
            newBalance = currentBalance - params.amount;
        } else if (params.type === "ADJUSTMENT") {
            newBalance = params.amount;
        }

        const updatedAccount = await prisma.bankAccount.update({
            where: { id: params.accountId },
            data: {
                balance: newBalance,
            },
        });

        const mutation = await prisma.accountMutation.create({
            data: {
                accountId: params.accountId,
                type: params.type as MutationType,
                amount: params.amount,
                description: params.description,
                reference: params.reference || null,
            },
        });

        return { account: updatedAccount, mutation };

    },

    async getRecentMutations(limit = 20) {
        return await prisma.accountMutation.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                account: true,
            },
        });
    },
};

