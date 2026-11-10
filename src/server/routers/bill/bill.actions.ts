import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";
import { billRepository } from "./bill.repository";
import { CreateBillInput, RecordPaymentInput } from "./bill.dto";

export interface BillItemDto {
  name: string;
  quantity: number;
  price: number;
}

export interface BillPaymentDto {
  id: string;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  accountName: string;
  bankName: string;
}

export interface BillRecordDto {
  id: string;
  invoiceNumber: string;
  title: string;
  contactName: string;
  contactPhone?: string | null;
  type: "RECEIVABLE" | "PAYABLE";
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  items: BillItemDto[];
  notes?: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  payments: BillPaymentDto[];
}

export const billActions = {
  async getAllBills(filters?: {
    type?: "RECEIVABLE" | "PAYABLE" | "ALL";
    status?: string;
  }): Promise<BillRecordDto[]> {
    let bills = await billRepository.getAll(filters);

    // Auto-seed starter sample bills if 0 bills exist in DB
    if (bills.length === 0 && (!filters || filters.type === "ALL")) {
      const existingSample = await prisma.bill.findFirst({
        where: { invoiceNumber: "INV-202611-001" },
      });

      if (!existingSample) {
        // Sample 1: Piutang Katering Acara (Receivable)
        await billRepository.create(
          {
            title: "Pesanan Katering Kopi & Konsumsi Kantor",
            contactName: "PT Sinar Digital Nusantara",
            contactPhone: "081298765432",
            type: "RECEIVABLE",
            dueDate: dayjs().add(5, "day").format("YYYY-MM-DD"),
            items: [
              { name: "Paket Kopi Susu Aren (50 Cup)", quantity: 1, price: 1000000 },
              { name: "Snack Box Premium (50 Box)", quantity: 1, price: 750000 },
            ],
            notes: "Pembayaran termin 7 hari setelah invoice diterima",
          },
          "INV-202611-001",
          1750000
        );

        // Sample 2: Utang Bahan Baku Supplier Ayam & Kopi (Payable)
        await billRepository.create(
          {
            title: "Pengadaan Bahan Baku Ayam & Biji Kopi Fresh",
            contactName: "CV Sumber Pangan Makmur",
            contactPhone: "082188990011",
            type: "PAYABLE",
            dueDate: dayjs().add(12, "day").format("YYYY-MM-DD"),
            items: [
              { name: "Ayam Potong Segar (30 Ekor)", quantity: 30, price: 38000 },
              { name: "Biji Kopi Arabika House Blend (5 Kg)", quantity: 5, price: 160000 },
            ],
            notes: "Jatuh tempo setiap tanggal 22 tiap bulan",
          },
          "BILL-202611-001",
          1940000
        );
      }

      bills = await billRepository.getAll(filters);
    }

    return bills.map((b) => ({
      id: b.id,
      invoiceNumber: b.invoiceNumber,
      title: b.title,
      contactName: b.contactName,
      contactPhone: b.contactPhone,
      type: b.type as "RECEIVABLE" | "PAYABLE",
      status: b.status as "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE",
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      remainingAmount: Number(b.totalAmount) - Number(b.paidAmount),
      dueDate: b.dueDate.toISOString(),
      items: Array.isArray(b.itemsJson) ? (b.itemsJson as any as BillItemDto[]) : [],
      notes: b.notes,
      createdByName: b.createdBy?.fullName || "Owner",
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      payments: b.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        notes: p.notes,
        accountName: p.account?.name || "Kas/Bank",
        bankName: p.account?.bankName || "-",
      })),
    }));
  },

  async getBillById(id: string): Promise<BillRecordDto | null> {
    const b = await billRepository.getById(id);
    if (!b) return null;

    return {
      id: b.id,
      invoiceNumber: b.invoiceNumber,
      title: b.title,
      contactName: b.contactName,
      contactPhone: b.contactPhone,
      type: b.type as "RECEIVABLE" | "PAYABLE",
      status: b.status as "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE",
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      remainingAmount: Number(b.totalAmount) - Number(b.paidAmount),
      dueDate: b.dueDate.toISOString(),
      items: Array.isArray(b.itemsJson) ? (b.itemsJson as any as BillItemDto[]) : [],
      notes: b.notes,
      createdByName: b.createdBy?.fullName || "Owner",
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      payments: b.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        notes: p.notes,
        accountName: p.account?.name || "Kas/Bank",
        bankName: p.account?.bankName || "-",
      })),
    };
  },

  async createBill(input: CreateBillInput, createdById?: string) {
    const prefix = input.type === "RECEIVABLE" ? "INV" : "BILL";
    const dateStr = dayjs().format("YYYYMM");
    const count = await prisma.bill.count({
      where: {
        invoiceNumber: {
          startsWith: `${prefix}-${dateStr}`,
        },
      },
    });

    const invoiceNumber =
      input.invoiceNumber?.trim() ||
      `${prefix}-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const bill = await billRepository.create(
      input,
      invoiceNumber,
      totalAmount,
      createdById
    );

    return {
      id: bill.id,
      invoiceNumber: bill.invoiceNumber,
      totalAmount: Number(bill.totalAmount),
    };
  },

  async recordPayment(input: RecordPaymentInput) {
    const result = await billRepository.recordPayment(input);
    return {
      success: true,
      paidAmount: Number(result.bill.paidAmount),
      status: result.bill.status,
    };
  },

  async deleteBill(id: string) {
    const deleted = await billRepository.delete(id);
    return {
      success: true,
      id: deleted.id,
      invoiceNumber: deleted.invoiceNumber,
    };
  },

  async getStats() {
    return await billRepository.getStats();
  },
};
