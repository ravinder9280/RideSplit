-- CreateEnum
CREATE TYPE "public"."RideService" AS ENUM ('UBER', 'OLA');

-- CreateEnum
CREATE TYPE "public"."RideStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ride" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fromText" TEXT NOT NULL,
    "toText" TEXT NOT NULL,
    "fromLat" DOUBLE PRECISION NOT NULL,
    "fromLng" DOUBLE PRECISION NOT NULL,
    "toLat" DOUBLE PRECISION NOT NULL,
    "toLng" DOUBLE PRECISION NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "seatsTotal" INTEGER NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    "estTotalFare" INTEGER NOT NULL,
    "perSeatPrice" INTEGER NOT NULL,
    "service" "public"."RideService" NOT NULL,
    "shareUrlEnc" TEXT,
    "shareUrlHash" TEXT,
    "status" "public"."RideStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RideMember" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'PENDING',
    "fareShare" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_shareUrlHash_key" ON "public"."Ride"("shareUrlHash");

-- CreateIndex
CREATE INDEX "Ride_status_departureAt_idx" ON "public"."Ride"("status", "departureAt");

-- CreateIndex
CREATE INDEX "Ride_ownerId_idx" ON "public"."Ride"("ownerId");

-- CreateIndex
CREATE INDEX "Ride_fromLat_fromLng_idx" ON "public"."Ride"("fromLat", "fromLng");

-- CreateIndex
CREATE INDEX "Ride_toLat_toLng_idx" ON "public"."Ride"("toLat", "toLng");

-- CreateIndex
CREATE INDEX "RideMember_userId_idx" ON "public"."RideMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RideMember_rideId_userId_key" ON "public"."RideMember"("rideId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideMember" ADD CONSTRAINT "RideMember_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideMember" ADD CONSTRAINT "RideMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
