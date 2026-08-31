-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('NOTE', 'TASK');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'STATUS_CHANGED', 'COMPLETED', 'SCHEDULED', 'UNSCHEDULED');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_at_idx" ON "ActivityLog"("userId", "at" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_entityType_entityId_idx" ON "ActivityLog"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_action_at_idx" ON "ActivityLog"("userId", "action", "at");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
