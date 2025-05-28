/*
  Warnings:

  - The `mailRecepcionFactura` column on the `Obra` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "mailRecepcionFactura",
ADD COLUMN     "mailRecepcionFactura" TEXT[];
