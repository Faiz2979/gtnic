import { z } from "zod";

export const getReportFilterSchema = z.object({
  period: z.string().optional(), // "YYYY-MM" or "ALL"
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type GetReportFilterInput = z.infer<typeof getReportFilterSchema>;

export interface ReportSummaryDto {
  period: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalTransactions: number;
}

export interface ReportCashFlowDto {
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  accounts: {
    id: string;
    name: string;
    bankName: string;
    type: string;
    balance: number;
  }[];
  recentCashMovements: {
    id: string;
    date: string;
    accountName: string;
    type: string;
    amount: number;
    description: string;
  }[];
}

export interface ReportProductPerformanceDto {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  currentStock: number;
}

export interface ReportStaffPerformanceDto {
  staffId: string;
  staffName: string;
  role: string;
  email: string;
  transactionCount: number;
  totalSales: number;
  contributionPercent: number;
}

export interface ComprehensiveReportDto {
  summary: ReportSummaryDto;
  cashFlow: ReportCashFlowDto;
  products: ReportProductPerformanceDto[];
  staff: ReportStaffPerformanceDto[];
  availablePeriods: string[];
}

