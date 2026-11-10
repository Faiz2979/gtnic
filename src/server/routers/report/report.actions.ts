import dayjs from "dayjs";
import { reportRepository } from "./report.repository";
import {
  ComprehensiveReportDto,
  GetReportFilterInput,
  ReportProductPerformanceDto,
  ReportStaffPerformanceDto,
} from "./report.dto";

export const reportActions = {
  async getComprehensiveReport(
    input?: GetReportFilterInput
  ): Promise<ComprehensiveReportDto> {
    const currentMonthPeriod = dayjs().format("YYYY-MM");
    const selectedPeriod = input?.period || currentMonthPeriod;

    // 1. Ambil data dari repository
    const [transactions, mutations, accounts, products, profiles, periods] =
      await Promise.all([
        reportRepository.getTransactions(selectedPeriod),
        reportRepository.getMutations(),
        reportRepository.getAccounts(),
        reportRepository.getProducts(),
        reportRepository.getProfiles(),
        reportRepository.getDistinctPeriods(),
      ]);

    // Tambahkan periode berjalan ke daftar jika belum ada
    const allPeriods = Array.from(new Set([currentMonthPeriod, ...periods])).sort(
      (a, b) => b.localeCompare(a)
    );

    // 2. Kalkulasi Ringkasan Finansial (Laba Rugi)
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    transactions.forEach((tx) => {
      const rev = Number(tx.sellingPrice) * tx.quantity;
      const cost = Number(tx.costPrice) * tx.quantity;
      totalRevenue += rev;
      totalCost += cost;
      totalProfit += Number(tx.totalProfit);
    });

    // Hitung beban operasional dari mutasi EXPENSE pada periode ini
    const filteredMutations = mutations.filter((m) => {
      if (selectedPeriod === "ALL") return true;
      return dayjs(m.createdAt).format("YYYY-MM") === selectedPeriod;
    });

    let operatingExpenses = 0;
    let cashInflow = 0;
    let cashOutflow = 0;

    filteredMutations.forEach((m) => {
      const amt = Number(m.amount);
      if (m.type === "INCOME") {
        cashInflow += amt;
      } else if (m.type === "EXPENSE") {
        cashOutflow += amt;
        operatingExpenses += amt;
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10 : 0;

    // 3. Analisis Performa Produk
    const productStatsMap = new Map<
      string,
      { unitsSold: number; revenue: number; profit: number }
    >();

    transactions.forEach((tx) => {
      const existing = productStatsMap.get(tx.productId) || {
        unitsSold: 0,
        revenue: 0,
        profit: 0,
      };
      existing.unitsSold += tx.quantity;
      existing.revenue += Number(tx.sellingPrice) * tx.quantity;
      existing.profit += Number(tx.totalProfit);
      productStatsMap.set(tx.productId, existing);
    });

    const productPerformanceList: ReportProductPerformanceDto[] = products
      .map((p) => {
        const stats = productStatsMap.get(p.id) || {
          unitsSold: 0,
          revenue: 0,
          profit: 0,
        };
        // Cari sisa stok pada periode berjalan
        const inv = p.inventories.find((i) => i.period === selectedPeriod);
        const currentStock = inv
          ? inv.currentStock
          : p.inventories[0]?.currentStock || 0;

        return {
          productId: p.id,
          productName: p.name,
          unitsSold: stats.unitsSold,
          revenue: stats.revenue,
          profit: stats.profit,
          currentStock,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold);

    // 4. Analisis Kontribusi Staf
    const staffStatsMap = new Map<
      string,
      { transactionCount: number; totalSales: number }
    >();

    transactions.forEach((tx) => {
      const existing = staffStatsMap.get(tx.createdById) || {
        transactionCount: 0,
        totalSales: 0,
      };
      existing.transactionCount += 1;
      existing.totalSales += Number(tx.sellingPrice) * tx.quantity;
      staffStatsMap.set(tx.createdById, existing);
    });

    const staffPerformanceList: ReportStaffPerformanceDto[] = profiles
      .map((profile) => {
        const stats = staffStatsMap.get(profile.id) || {
          transactionCount: 0,
          totalSales: 0,
        };
        const contributionPercent =
          totalRevenue > 0
            ? Math.round((stats.totalSales / totalRevenue) * 100 * 10) / 10
            : 0;

        return {
          staffId: profile.id,
          staffName: profile.fullName || "Tanpa Nama",
          role: profile.role,
          email: profile.email,
          transactionCount: stats.transactionCount,
          totalSales: stats.totalSales,
          contributionPercent,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    // 5. Arus Kas & Posisi Rekening
    const accountsData = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      bankName: acc.bankName,
      type: acc.type,
      balance: Number(acc.balance),
    }));

    const recentCashMovements = filteredMutations.slice(0, 15).map((m) => ({
      id: m.id,
      date: m.createdAt.toISOString(),
      accountName: m.account.name,
      type: m.type,
      amount: Number(m.amount),
      description: m.description,
    }));

    return {
      summary: {
        period: selectedPeriod,
        totalRevenue,
        totalCost,
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin,
        totalTransactions: transactions.length,
      },
      cashFlow: {
        cashInflow,
        cashOutflow,
        netCashFlow: cashInflow - cashOutflow,
        accounts: accountsData,
        recentCashMovements,
      },
      products: productPerformanceList,
      staff: staffPerformanceList,
      availablePeriods: allPeriods,
    };
  },
};

