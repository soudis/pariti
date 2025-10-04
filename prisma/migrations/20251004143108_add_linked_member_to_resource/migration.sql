-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "linkedMemberId" TEXT;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_linkedMemberId_fkey" FOREIGN KEY ("linkedMemberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
