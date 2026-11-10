
import dayjs from "dayjs";
import {
  ComprehensiveReportDto,
  GetReportFilterInput,
  ReportProductPerformanceDto,
  ReportStaffPerformanceDto,
} from "./report.dto";
import { reportRepository } from "./report.repository";

export const reportActions = {
  async getComprehensiveReport(
    input?: GetReportFilterInput
  ): Promise<ComprehensiveReportDto> {
    const currentMonthPeriod = dayjs().format("YYYY-MM");
    const selectedPeriod = input?.period || currentMonthPeriod;

    // 1. Fetch data secara paralel
    const [
      transactions,
      mutations,
      accounts,
      products,
      profiles,
      periods,
    ] = await Promise.all([
      reportRepository.getTransactions(selectedPeriod),
      reportRepository.getMutations(),
      reportRepository.getAccounts(),
      reportRepository.getProducts(),
      reportRepository.getProfiles(),
      reportRepository.getDistinctPeriods(),
    ]);

    const allPeriods = Array.from(
      new Set([currentMonthPeriod, ...periods])
    ).sort((a, b) => b.localeCompare(a));

    // 2. Financial Summary
    let totalRevenue = 0;
    let totalCost = 0;

    transactions.forEach((tx) => {
      const revenue = Number(tx.sellingPrice) * tx.quantity;
      const cost = Number(tx.costPrice) * tx.quantity;

      totalRevenue += revenue;
      totalCost += cost;
    });

    // 3. Filter mutations berdasarkan periode
    const filteredMutations = mutations.filter((mutation) => {
      if (selectedPeriod === "ALL") return true;

      return (
        dayjs(mutation.createdAt).format("YYYY-MM") === selectedPeriod
      );
    });

    let operatingExpenses = 0;
    let cashInflow = 0;
    let cashOutflow = 0;

    filteredMutations.forEach((mutation) => {
      const amount = Number(mutation.amount);

      if (mutation.type === "INCOME") {
        cashInflow += amount;
      } else if (mutation.type === "EXPENSE") {
        cashOutflow += amount;
        operatingExpenses += amount;
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - operatingExpenses;

    const profitMargin =
      totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10
        : 0;

    // 4. Product Performance
    const productStatsMap = new Map<
      string,
      {
        unitsSold: number;
        revenue: number;
        profit: number;
      }
    >();

    transactions.forEach((tx) => {
      const existing = productStatsMap.get(tx.productId) ?? {
        unitsSold: 0,
        revenue: 0,
        profit: 0,
      };

      existing.unitsSold += tx.quantity;
      existing.revenue += Number(tx.sellingPrice) * tx.quantity;
      existing.profit += Number(tx.totalProfit);

      productStatsMap.set(tx.productId, existing);
    });

    const productPerformanceList: ReportProductPerformanceDto[] =
      products
        .map((product) => {
          const stats = productStatsMap.get(product.id) ?? {
            unitsSold: 0,
            revenue: 0,
            profit: 0,
          };

          const inventory = product.inventories.find(
            (item) => item.period === selectedPeriod
          );

          const currentStock =
            inventory?.currentStock ??
            product.inventories[0]?.currentStock ??
            0;

          return {
            productId: product.id,
            productName: product.name,
            unitsSold: stats.unitsSold,
            revenue: stats.revenue,
            profit: stats.profit,
            currentStock,
          };
        })
        .sort((a, b) => b.unitsSold - a.unitsSold);

    // 5. Staff Performance
    const staffStatsMap = new Map<
      string,
      {
        transactionCount: number;
        totalSales: number;
      }
    >();

    transactions.forEach((tx) => {
      const existing = staffStatsMap.get(tx.createdById) ?? {
        transactionCount: 0,
        totalSales: 0,
      };

      existing.transactionCount += 1;
      existing.totalSales +=
        Number(tx.sellingPrice) * tx.quantity;

      staffStatsMap.set(tx.createdById, existing);
    });

    const staffPerformanceList: ReportStaffPerformanceDto[] =
      profiles
        .map((profile) => {
          const stats = staffStatsMap.get(profile.id) ?? {
            transactionCount: 0,
            totalSales: 0,
          };

          const contributionPercent =
            totalRevenue > 0
              ? Math.round(
                  (stats.totalSales / totalRevenue) * 100 * 10
                ) / 10
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

    // 6. Cash Flow & Account Positions
    const accountsData = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      bankName: account.bankName,
      type: account.type,
      balance: Number(account.balance),
    }));

    const recentCashMovements = filteredMutations
      .slice(0, 15)
      .map((mutation) => ({
        id: mutation.id,
        date: mutation.createdAt.toISOString(),
        accountName: mutation.account.name,
        type: mutation.type,
        amount: Number(mutation.amount),
        description: mutation.description,
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
