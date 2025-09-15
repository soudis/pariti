-- AlterTable
ALTER TABLE "consumption_members" ADD COLUMN     "weight" DECIMAL(5,2) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "expense_members" ADD COLUMN     "weight" DECIMAL(5,2) NOT NULL DEFAULT 1;
