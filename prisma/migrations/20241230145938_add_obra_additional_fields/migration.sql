/*
  Warnings:

  - Added the required column `nombreCliente` to the `Obra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "georreferencia" TEXT,
ADD COLUMN     "mandante" TEXT,
ADD COLUMN     "nombreCliente" TEXT NOT NULL,
ADD COLUMN     "referencia" TEXT,
ADD COLUMN     "sector" TEXT;
