-- AlterEnum
ALTER TYPE "public"."RideService" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "public"."RideMember" ADD COLUMN     "seatsRequested" INTEGER NOT NULL DEFAULT 1;
