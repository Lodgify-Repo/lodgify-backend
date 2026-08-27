/*
  Warnings:

  - The values [HOTEL_MANAGER,GUEST] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditLogAction" ADD VALUE 'HOTEL_APPROVED';
ALTER TYPE "AuditLogAction" ADD VALUE 'HOTEL_REJECTED';
ALTER TYPE "AuditLogAction" ADD VALUE 'BRANCH_DEACTIVATED';
ALTER TYPE "AuditLogAction" ADD VALUE 'BRANCH_REACTIVATED';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HOTEL_OWNER', 'BRANCH_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'RESTAURANT_STAFF', 'FOOD_SERVICE_MANAGER', 'TRAVELER', 'PROPERTY_OWNER', 'AGENT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE 
    WHEN "role"::text = 'HOTEL_MANAGER' THEN 'BRANCH_MANAGER'::text::"Role_new"
    WHEN "role"::text = 'GUEST' THEN 'TRAVELER'::text::"Role_new"
    ELSE "role"::text::"Role_new"
  END
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TRAVELER';
COMMIT;

-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "companyRegistrationUrl" TEXT,
ADD COLUMN     "licenseUrl" TEXT;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "foodServiceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "policies" JSONB;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "starRating" INTEGER,
ADD COLUMN     "verificationDocuments" TEXT[],
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
DELETE FROM "Property";
ALTER TABLE "Property" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3),
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'TRAVELER';

-- CreateTable
CREATE TABLE "PropertyOwnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deedUrl" TEXT,
    "utilityBillUrl" TEXT,
    "idUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAccountInvitation" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAccountInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwnerProfile_userId_key" ON "PropertyOwnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccountInvitation_token_key" ON "SubAccountInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOwnerProfile" ADD CONSTRAINT "PropertyOwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccountInvitation" ADD CONSTRAINT "SubAccountInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
