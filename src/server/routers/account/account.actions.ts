import { prisma } from "@/lib/prisma";
import { accountRepository } from "./account.repository";
import { CreateAccountInput, UpdateAccountInput, AdjustBalanceInput } from "./account.dto";

export const accountActions = {
  async getAllAccounts() {
    let accounts = await accountRepository.getAll();

    // If no accounts exist yet, seed a default set of realistic accounts safely
    if (accounts.length === 0) {
      const existingBCA = await prisma.bankAccount.findFirst({
        where: { accountNumber: "8735129088" },
      });
      if (!existingBCA) {
        await accountRepository.create({
          name: "BCA Operasional Utama",
          bankName: "BCA",
          accountNumber: "8735129088",
          holderName: "PT GTNIC KREATIF INDONESIA",
          type: "BANK",
          balance: 24500000,
          isActive: true,
          isPrimary: true,
          notes: "Rekening utama penerimaan transfer pelanggan & pembayaran supplier",
        });

        await accountRepository.create({
          name: "Kas Tunai Toko (Laci Kasir)",
          bankName: "Kas Tunai",
          accountNumber: "KAS-TOKO-01",
          holderName: "Kasir Operasional Toko",
          type: "CASH",
          balance: 3250000,
          isActive: true,
          isPrimary: false,
          notes: "Uang kas fisik di laci kasir untuk transaksi offline dan kembalian",
        });

        await accountRepository.create({
          name: "QRIS & E-Wallet Toko",
          bankName: "QRIS / GoPay Merchant",
          accountNumber: "ID1020039281928",
          holderName: "GTNIC STORE OFFICIAL",
          type: "EWALLET",
          balance: 5120000,
          isActive: true,
          isPrimary: false,
          notes: "Settlement harian dari pembayaran QRIS Statis meja kasir",
        });
      }
      accounts = await accountRepository.getAll();
    }

        return accounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            holderName: acc.holderName,
            type: acc.type,
            balance: Number(acc.balance),
            isActive: acc.isActive,
            isPrimary: acc.isPrimary,
            notes: acc.notes,
            createdAt: acc.createdAt.toISOString(),
            updatedAt: acc.updatedAt.toISOString(),
            mutations: acc.mutations.map((m) => ({
                id: m.id,
                type: m.type,
                amount: Number(m.amount),
                description: m.description,
                reference: m.reference,
                createdAt: m.createdAt.toISOString(),
            })),
        }));
    },

    async getAccountById(id: string) {
        const acc = await accountRepository.getById(id);
        if (!acc) return null;

        return {
            id: acc.id,
            name: acc.name,
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            holderName: acc.holderName,
            type: acc.type,
            balance: Number(acc.balance),
            isActive: acc.isActive,
            isPrimary: acc.isPrimary,
            notes: acc.notes,
            createdAt: acc.createdAt.toISOString(),
            updatedAt: acc.updatedAt.toISOString(),
            mutations: acc.mutations.map((m) => ({
                id: m.id,
                type: m.type,
                amount: Number(m.amount),
                description: m.description,
                reference: m.reference,
                createdAt: m.createdAt.toISOString(),
            })),
        };
    },

    async getStats() {
        const accounts = await this.getAllAccounts();
        const activeAccounts = accounts.filter((a) => a.isActive);

        const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalBankBalance = activeAccounts
            .filter((a) => a.type === "BANK")
            .reduce((sum, a) => sum + a.balance, 0);
        const totalCashBalance = activeAccounts
            .filter((a) => a.type === "CASH")
            .reduce((sum, a) => sum + a.balance, 0);
        const totalEwalletBalance = activeAccounts
            .filter((a) => a.type === "EWALLET")
            .reduce((sum, a) => sum + a.balance, 0);

        return {
            totalBalance,
            totalBankBalance,
            totalCashBalance,
            totalEwalletBalance,
            totalAccounts: accounts.length,
            activeAccountsCount: activeAccounts.length,
        };
    },

    async getRecentMutations(limit = 25) {
        const list = await accountRepository.getRecentMutations(limit);
        return list.map((m) => ({
            id: m.id,
            accountId: m.accountId,
            accountName: m.account.name,
            bankName: m.account.bankName,
            accountNumber: m.account.accountNumber,
            type: m.type,
            amount: Number(m.amount),
            description: m.description,
            reference: m.reference,
            createdAt: m.createdAt.toISOString(),
        }));
    },

    async createAccount(input: CreateAccountInput, userId?: string) {
        const acc = await accountRepository.create(input, userId);
        return {
            id: acc.id,
            name: acc.name,
            balance: Number(acc.balance),
        };
    },

    async updateAccount(input: UpdateAccountInput) {
        const { id, ...data } = input;
        const acc = await accountRepository.update(id, data);
        return {
            id: acc.id,
            name: acc.name,
            balance: Number(acc.balance),
        };
    },

    async deleteAccount(id: string) {
        return await accountRepository.delete(id);
    },

    async adjustBalance(input: AdjustBalanceInput) {
        const result = await accountRepository.recordMutation({
            accountId: input.accountId,
            type: input.type,
            amount: input.amount,
            description: input.description,
            reference: input.reference,
        });

        return {
            success: true,
            newBalance: Number(result.account.balance),
            mutationId: result.mutation.id,
        };
    },
};

