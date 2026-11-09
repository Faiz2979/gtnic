// src/server/routers/dashboard/dashboard.router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { dashboardActions } from "./dashboard.actions";

// Helper: ambil profile user untuk cek role
import { userRepository } from "../user/user.repository";

export const dashboardRouter = router({
    /**
     * Dashboard untuk Owner — data lengkap termasuk arus kas, stok rendah, dll.
     * Hanya bisa diakses oleh user dengan role OWNER
     */
    getOwnerDashboard: protectedProcedure.query(async ({ ctx }) => {
        const profile = await userRepository.getProfileById(ctx.user.id);

        if (!profile || profile.role !== "OWNER") {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Hanya owner yang dapat mengakses dashboard ini.",
            });
        }

        return await dashboardActions.getOwnerDashboard();
    }),

    /**
     * Dashboard untuk Staff — data terbatas
     * Bisa diakses oleh semua user yang sudah login
     */
    getStaffDashboard: protectedProcedure.query(async ({ ctx }) => {
        return await dashboardActions.getStaffDashboard(ctx.user.id);
    }),
});
