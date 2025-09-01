/*
  Warnings:

  - You are about to drop the column `tipoOT` on the `OrdenTrabajo` table. All the data in the column will be lost.
  - Added the required column `tipoOrdenTrabajoId` to the `OrdenTrabajo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrdenTrabajo" DROP COLUMN "tipoOT",
ADD COLUMN     "tipoOrdenTrabajoId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "TipoOrdenTrabajo";

-- CreateTable
CREATE TABLE "TipoOrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoOrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdenTrabajo_tipoOrdenTrabajoId_idx" ON "OrdenTrabajo"("tipoOrdenTrabajoId");

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_tipoOrdenTrabajoId_fkey" FOREIGN KEY ("tipoOrdenTrabajoId") REFERENCES "TipoOrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
