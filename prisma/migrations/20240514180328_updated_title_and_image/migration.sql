/*
  Warnings:

  - You are about to drop the column `itemImageUrl` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `itemName` on the `Item` table. All the data in the column will be lost.
  - Added the required column `title` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "itemImageUrl",
DROP COLUMN "itemName",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;
