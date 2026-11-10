import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { accountActions } from "./account.actions";
import {
    createAccountSchema,
    updateAccountSchema,
    adjustBalanceSchema,
} from "./account.dto";

export const accountRouter = router({
    getAllAccounts: protectedProcedure.query(async () => {
        return await accountActions.getAllAccounts();
    }),

    getStats: protectedProcedure.query(async () => {
        return await accountActions.getStats();
    }),

    getAccountById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input }) => {
            return await accountActions.getAccountById(input.id);
        }),

    getRecentMutations: protectedProcedure
        .input(z.object({ limit: z.number().optional() }).optional())
        .query(async ({ input }) => {
            return await accountActions.getRecentMutations(input?.limit ?? 25);
        }),

    createAccount: protectedProcedure
        .input(createAccountSchema)
        .mutation(async ({ input, ctx }) => {
            return await accountActions.createAccount(input, ctx.user?.id);
        }),

    updateAccount: protectedProcedure
        .input(updateAccountSchema)
        .mutation(async ({ input }) => {
            return await accountActions.updateAccount(input);
        }),

    deleteAccount: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
            return await accountActions.deleteAccount(input.id);
        }),

    adjustBalance: protectedProcedure
        .input(adjustBalanceSchema)
        .mutation(async ({ input }) => {
            return await accountActions.adjustBalance(input);
        }),
});

