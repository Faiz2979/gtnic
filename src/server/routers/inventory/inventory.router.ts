import { protectedProcedure, router } from "@/server/trpc";
import { inventoryActions } from "./inventory.actions";
import { addStockSchema } from "./inventory.dto";

export const inventoryRouter = router({
  addStock: protectedProcedure
    .input(addStockSchema)
    .mutation(async ({ input }) => {
      return await inventoryActions.addStock(input);
    }),
});