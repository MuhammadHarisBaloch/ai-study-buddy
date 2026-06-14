-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "chunk" ADD COLUMN     "embedding" vector(768);
