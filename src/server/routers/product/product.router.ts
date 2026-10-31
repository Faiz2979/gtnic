// src/server/routers/product/router.ts
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { productActions } from "./product.actions";
import { createProductSchema, updateProductSchema } from "./product.dto";

export const productRouter = router({
    getAllProducts: protectedProcedure.query(async () => {
        return await productActions.getAllProducts();
    }),

    getProductById: protectedProcedure
        .input(z.object({
            id: z.uuid("Format ID tidak valid")
        }))
        .mutation(async ({ input }) => {
            return await productActions.getProductById(input.id);
        }),

    createProduct: protectedProcedure.input(createProductSchema).mutation(async ({ input }) => {
        return await productActions.createProduct(input);
    }),

    updateProduct: protectedProcedure.input(updateProductSchema).mutation(async ({ input }) => {
        return await productActions.updateProduct(input);
    }),

    deleteProduct: protectedProcedure.input(z.uuid()).mutation(async ({ input }) => {
        return await productActions.deleteProduct(input);
    }),
})