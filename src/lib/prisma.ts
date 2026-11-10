import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../lib/generated/prisma";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = () => {
  if (
    globalForPrisma.prisma &&
    "bankAccount" in globalForPrisma.prisma &&
    "bill" in globalForPrisma.prisma
  ) {
    return globalForPrisma.prisma;
  }
  const freshClient = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = freshClient;
  }
  return freshClient;
};

export const prisma = getPrismaClient();