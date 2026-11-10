import { prisma } from "@/lib/prisma";
import { BillType, BillStatus, MutationType } from "../../../../lib/generated/prisma";
import { CreateBillInput, RecordPaymentInput } from "./bill.dto";

export const billRepository = {
  async getAll(filters?: {
    type?: "RECEIVABLE" | "PAYABLE" | "ALL";
    status?: string;
  }) {
    const where: any = {};

    if (filters?.type && filters.type !== "ALL") {
      where.type = filters.type as BillType;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as BillStatus;
    }

    return await prisma.bill.findMany({
      where,
      include: {
        createdBy: true,
        payments: {
          include: {
            account: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });
  },

  async getById(id: string) {
    return await prisma.bill.findUnique({
      where: { id },
      include: {
        createdBy: true,
        payments: {
          include: {
            account: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async create(data: CreateBillInput, invoiceNumber: string, totalAmount: number, createdById?: string) {
    const dueDate = new Date(data.dueDate);

    return await prisma.bill.create({
      data: {
        invoiceNumber,
        title: data.title,
        contactName: data.contactName,
        contactPhone: data.contactPhone || null,
        type: data.type as BillType,
        status: BillStatus.UNPAID,
        totalAmount,
        paidAmount: 0,
        dueDate,
        itemsJson: data.items,
        notes: data.notes || null,
        createdById: createdById || null,
      },
      include: {
        createdBy: true,
      },
    });
  },

  async recordPayment(input: RecordPaymentInput) {
    const bill = await prisma.bill.findUnique({
      where: { id: input.billId },
    });

    if (!bill) {
      throw new Error("Data tagihan tidak ditemukan");
    }

    const currentPaid = Number(bill.paidAmount);
    const totalAmount = Number(bill.totalAmount);
    const newPaidAmount = currentPaid + input.amount;

    if (newPaidAmount > totalAmount) {
      throw new Error(`Nominal pembayaran melebihi sisa tagihan! Sisa yang harus dibayar: Rp ${totalAmount - currentPaid}`);
    }

    let newStatus: BillStatus = BillStatus.PARTIAL;
    if (newPaidAmount >= totalAmount) {
      newStatus = BillStatus.PAID;
    }

    // 1. Simpan bukti pembayaran
    const payment = await prisma.billPayment.create({
      data: {
        billId: input.billId,
        accountId: input.accountId,
        amount: input.amount,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        notes: input.notes || null,
      },
    });

    // 2. Perbarui status & saldo terbayar tagihan
    const updatedBill = await prisma.bill.update({
      where: { id: input.billId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // 3. Otomatisasi Saldo Rekening Bank/Kas
    if (input.accountId) {
      const isReceivable = bill.type === BillType.RECEIVABLE;

      await prisma.bankAccount.update({
        where: { id: input.accountId },
        data: {
          balance: isReceivable
            ? { increment: input.amount }
            : { decrement: input.amount },
        },
      });

      // 4. Catat mutasi kas masuk / keluar
      await prisma.accountMutation.create({
        data: {
          accountId: input.accountId,
          type: isReceivable ? MutationType.INCOME : MutationType.EXPENSE,
          amount: input.amount,
          description: isReceivable
            ? `Pelunasan Piutang (${bill.invoiceNumber}) - ${bill.contactName}`
            : `Pembayaran Utang (${bill.invoiceNumber}) - ${bill.contactName}`,
          reference: bill.invoiceNumber,
        },
      });
    }

    return { bill: updatedBill, payment };
  },

  async updateStatus(id: string, status: BillStatus) {
    return await prisma.bill.update({
      where: { id },
      data: { status },
    });
  },

  async delete(id: string) {
    return await prisma.bill.delete({
      where: { id },
    });
  },

  async getStats() {
    const allBills = await prisma.bill.findMany();
    const now = new Date();

    // Auto-update status overdue jika sudah lewat jatuh tempo dan belum lunas
    const overdueBillsToUpdate = allBills.filter(
      (b) => (b.status === "UNPAID" || b.status === "PARTIAL") && new Date(b.dueDate) < now
    );

    if (overdueBillsToUpdate.length > 0) {
      await prisma.bill.updateMany({
        where: {
          id: { in: overdueBillsToUpdate.map((b) => b.id) },
        },
        data: { status: BillStatus.OVERDUE },
      });
    }

    const receivables = allBills.filter((b) => b.type === "RECEIVABLE");
    const payables = allBills.filter((b) => b.type === "PAYABLE");

    const totalReceivablesUnpaid = receivables
      .filter((b) => b.status !== "PAID")
      .reduce((sum, b) => sum + (Number(b.totalAmount) - Number(b.paidAmount)), 0);

    const totalPayablesUnpaid = payables
      .filter((b) => b.status !== "PAID")
      .reduce((sum, b) => sum + (Number(b.totalAmount) - Number(b.paidAmount)), 0);

    const overdueCount = allBills.filter(
      (b) => (b.status === "OVERDUE" || b.status === "UNPAID" || b.status === "PARTIAL") && new Date(b.dueDate) < now
    ).length;

    const paidThisMonthCount = allBills.filter((b) => b.status === "PAID").length;

    return {
      totalReceivablesUnpaid,
      totalPayablesUnpaid,
      overdueCount,
      paidThisMonthCount,
      totalBills: allBills.length,
    };
  },
};

