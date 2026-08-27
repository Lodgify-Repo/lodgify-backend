yarn run v1.22.22
$ "C:\Users\Lord Herrschaft\prop-hotel-mgt\prop-hotel-mgt\node_modules\.bin\prisma" migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "RoomStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "roomPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "features" TEXT[],
ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "RoomMaintenance" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomMaintenance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoomMaintenance" ADD CONSTRAINT "RoomMaintenance_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

Done in 13.87s.
