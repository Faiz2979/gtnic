// src/server/routers/closing/closing.router.ts
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
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Gagal memperbarui stok fisik opname.",
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
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal mengeksekusi closing bulanan.",
        });
      }
    }),

  // 4. Endpoint preview kalkulasi closing (omzet, modal, net profit, carry-over, dsb)
  getPreview: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .query(async ({ input }) => {
      try {
        return await ClosingActions.getPreview(input.period);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal memuat preview kalkulasi closing.",
        });
      }
    }),

  // 5. Endpoint arsip riwayat closing
  getAllClosings: protectedProcedure.query(async () => {
    try {
      return await ClosingActions.getAllClosings();
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat arsip riwayat closing.",
      });
    }
  }),

  // 6. Endpoint membuka kembali periode closing (Reopen)
  reopen: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await ClosingActions.reopenClosing(input.period);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal membuka kembali periode closing.",
        });
      }
    }),
});
