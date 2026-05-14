-- AlterTable
ALTER TABLE "consumptions" ADD COLUMN "isUnitAmount" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the previous interpretation for existing by-usage resources that have units.
UPDATE "consumptions"
SET "isUnitAmount" = true
FROM "resources"
WHERE "consumptions"."resourceId" = "resources"."id"
  AND "resources"."billingType" = 'byUsage'
  AND "resources"."unit" IS NOT NULL
  AND "resources"."unitPrice" IS NOT NULL;
