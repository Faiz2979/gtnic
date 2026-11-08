// src/server/routers/closing/router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { ClosingActions } from "./closing.actions";

export const closingRouter = router({
  // Endpoint untuk mengambil preview data rekap sebelum closing diketok
  getPreview: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .query(async ({ input }) => {
      return await ClosingActions.previewClosing(input.period);
    }),

  // Endpoint eksekusi penutupan buku (mengambil ID user/Owner dari sesi tRPC)
  execute: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mengambil ID user yang sedang login dari konteks (sesuaikan dengan properti session Anda, misal: ctx.session.user.id)
      const closedById = ctx.user?.id; 

      if (!closedById) {
        throw new Error("Unauthorized: ID Pengguna tidak ditemukan dalam sesi aktif.");
      }

      return await ClosingActions.executeClosing(input.period, closedById);
    }),
});