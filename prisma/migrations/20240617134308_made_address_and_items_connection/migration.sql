/*
  Warnings:

  - Added the required column `addressId` to the `ItemUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemUser" ADD COLUMN     "addressId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ItemUser" ADD CONSTRAINT "ItemUser_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
