-- AlterTable
ALTER TABLE "consumption_members" ADD COLUMN     "weightTypeId" TEXT;

-- AlterTable
ALTER TABLE "expense_members" ADD COLUMN     "weightTypeId" TEXT;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "weightTypes" JSONB;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "weights" JSONB;
