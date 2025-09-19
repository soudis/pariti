/*
  Warnings:

  - You are about to drop the column `isManuallyEdited` on the `consumption_members` table. All the data in the column will be lost.
  - You are about to drop the column `weightTypeId` on the `consumption_members` table. All the data in the column will be lost.
  - You are about to drop the column `isManuallyEdited` on the `expense_members` table. All the data in the column will be lost.
  - You are about to drop the column `weightTypeId` on the `expense_members` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "consumption_members" DROP COLUMN "isManuallyEdited",
DROP COLUMN "weightTypeId",
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "consumptions" ADD COLUMN     "splitAll" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "sharingMethod" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expense_members" DROP COLUMN "isManuallyEdited",
DROP COLUMN "weightTypeId",
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "splitAll" SET DEFAULT true,
ALTER COLUMN "sharingMethod" DROP DEFAULT;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "weight";
