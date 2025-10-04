-- AlterTable
ALTER TABLE "consumptions" ALTER COLUMN "splitAll" SET DEFAULT false;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "memberActiveDurationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringExpensesEnabled" BOOLEAN NOT NULL DEFAULT false;
