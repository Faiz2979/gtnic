// src/app/api/trpc/[trpc]/route.ts
import { appRouter } from "@/server";
import { createTRPCContext } from "@/server/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        // Pastikan opts / req diteruskan ke createTRPCContext
        createContext: (opts) => createTRPCContext({ req, resHeaders: opts.resHeaders }),
    });

export { handler as GET, handler as POST };
