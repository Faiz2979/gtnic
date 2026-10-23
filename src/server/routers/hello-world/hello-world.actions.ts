import { publicProcedure } from "../../trpc";

export const helloWorldAction = publicProcedure.query(() => {
  return 'Hello, World!';
})