/*
  Warnings:

  - The primary key for the `ItemUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ItemUser" DROP CONSTRAINT "ItemUser_pkey",
ADD CONSTRAINT "ItemUser_pkey" PRIMARY KEY ("userId", "itemId", "addressId");
