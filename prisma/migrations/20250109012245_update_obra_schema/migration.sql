/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ContactoObra` table. All the data in the column will be lost.
  - You are about to drop the column `telefono2` on the `ContactoObra` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ContactoObra` table. All the data in the column will be lost.
  - You are about to drop the column `fechaCreacion` on the `Obra` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContactoObra" DROP COLUMN "createdAt",
DROP COLUMN "telefono2",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "fechaCreacion",
ALTER COLUMN "estado" SET DEFAULT 'activo',
ALTER COLUMN "estadoObra" SET DEFAULT 'Activo';
