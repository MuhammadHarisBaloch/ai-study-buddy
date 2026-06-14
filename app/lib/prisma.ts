import { PrismaClient } from "@prisma/client";

// In dev, Next.js hot-reloads your code on every save. Without this guard, each
// reload would create a BRAND NEW PrismaClient (and a new DB connection), and you'd
// quickly exhaust Neon's connection limit. So we cache one client on the global object
// and reuse it across reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Only cache in dev. In production each server instance makes its own once, which is fine.
if (process.env.NODE_ENV != "production") {
  globalForPrisma.prisma = prisma;
}
