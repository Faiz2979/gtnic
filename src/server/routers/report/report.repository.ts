import { prisma } from "@/lib/prisma";

export const reportRepository = {
  async getTransactions(period?: string) {
    return await prisma.transaction.findMany({
      where: period && period !== "ALL" ? { period } : undefined,
      include: {
        product: true,
        createdBy: true,
        account: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getMutations() {
    return await prisma.accountMutation.findMany({
      include: {
        account: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAccounts() {
    return await prisma.bankAccount.findMany({
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  },

  async getProducts() {
    return await prisma.product.findMany({
      include: {
        inventories: true,
      },
    });
  },

  async getProfiles() {
    return await prisma.profile.findMany({
      orderBy: { fullName: "asc" },
    });
  },

  async getDistinctPeriods() {
    const records = await prisma.transaction.findMany({
      select: { period: true },
      distinct: ["period"],
      orderBy: { period: "desc" },
    });
    return records.map((r) => r.period);
  },
};

