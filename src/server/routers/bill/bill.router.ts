import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { billActions } from "./bill.actions";
import {
  createBillSchema,
  recordPaymentSchema,
  updateBillStatusSchema,
} from "./bill.dto";

export const billRouter = router({
  getAllBills: protectedProcedure
    .input(
      z
        .object({
          type: z.enum(["RECEIVABLE", "PAYABLE", "ALL"]).optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await billActions.getAllBills(input);
    }),

  getBillById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await billActions.getBillById(input.id);
    }),

  getStats: protectedProcedure.query(async () => {
    return await billActions.getStats();
  }),

  createBill: protectedProcedure
    .input(createBillSchema)
    .mutation(async ({ input, ctx }) => {
      return await billActions.createBill(input, ctx.user?.id);
    }),

  recordPayment: protectedProcedure
    .input(recordPaymentSchema)
    .mutation(async ({ input }) => {
      return await billActions.recordPayment(input);
    }),

  deleteBill: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await billActions.deleteBill(input.id);
    }),
});

