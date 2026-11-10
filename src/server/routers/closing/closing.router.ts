// src/server/routers/closing/router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ClosingActions } from "./closing.actions";
import { ClosingRepository } from "./closing.repository";

export const closingRouter = router({
  // 1. Endpoint untuk mengambil data draf closing beserta JSON snapshot item
  getDraftByPeriod: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .query(async ({ input }) => {
      const draft = await ClosingRepository.getByPeriod(input.period);
      return draft;
    }),

  // 2. Endpoint bagi Staff untuk memperbarui opname stok fisik & mencatat selisih (kurang/lebih)
  updatePhysicalStock: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
        productId: z.string().uuid("ID Produk harus berupa UUID yang valid"),
        physicalStock: z.number().int().min(0, "Stok fisik tidak boleh negatif"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await ClosingActions.updateStaffStockOpname({
          period: input.period,
          productId: input.productId,
          physicalStock: input.physicalStock,
          notes: input.notes,
        });
        return { success: true, data: result };
      } catch (error: unknown) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (error as Error).message || "Gagal memperbarui stok fisik opname.",
        });
      }
    }),

  // 3. Endpoint eksekusi penutupan buku (Final oleh Owner)
  execute: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const closedById = ctx.user?.id;

      if (!closedById) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized: ID Pengguna tidak ditemukan dalam sesi aktif.",
        });
      }

      try {
        return await ClosingActions.executeClosing(input.period, closedById);
      } catch (error: unknown) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message || "Gagal mengeksekusi closing bulanan.",
        });
      }
    }),
});