// src/server/routers/transaction/transaction.router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { transactionAction } from "./transaction.actions";
import { createTransactionSchema } from "./transaction.dto";

export const transactionRouter = router({
  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      return await transactionAction.createTransaction(input, userId);
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .query(async ({ input }) => {
      return await transactionAction.getAllTransactions(input.period);
    }),
});