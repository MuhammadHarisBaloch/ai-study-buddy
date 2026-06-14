-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "data" JSONB,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'chat';
