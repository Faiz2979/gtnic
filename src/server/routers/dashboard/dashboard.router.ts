// src/server/routers/dashboard/dashboard.router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { dashboardActions } from "./dashboard.actions";

import { userRepository } from "../user/user.repository";

export const dashboardRouter = router({

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
    getStaffDashboard: protectedProcedure.query(async () => {
        return await dashboardActions.getStaffDashboard( );
    }),
});
