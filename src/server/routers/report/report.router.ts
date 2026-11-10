import { protectedProcedure, router } from "@/server/trpc";
import { getReportFilterSchema } from "./report.dto";
import { reportActions } from "./report.actions";

export const reportRouter = router({
  getComprehensiveReport: protectedProcedure
    .input(getReportFilterSchema.optional())
    .query(async ({ input }) => {
      return await reportActions.getComprehensiveReport(input);
    }),
});

