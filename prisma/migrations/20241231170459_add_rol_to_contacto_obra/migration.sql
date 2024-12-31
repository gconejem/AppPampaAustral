/*
  Warnings:

  - You are about to drop the column `cargo` on the `ContactoObra` table. All the data in the column will be lost.
  - Added the required column `rol` to the `ContactoObra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactoObra" DROP COLUMN "cargo",
ADD COLUMN     "rol" TEXT NOT NULL;
