-- AlterTable
ALTER TABLE "consumptions" ADD COLUMN     "sharingMethod" TEXT NOT NULL DEFAULT 'equal';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "sharingMethod" TEXT NOT NULL DEFAULT 'equal';
