/*
  Warnings:

  - You are about to drop the column `numeroSerie` on the `Densidad` table. All the data in the column will be lost.
  - You are about to drop the column `tipoMedicion` on the `Densidad` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Densidad" DROP COLUMN "numeroSerie",
DROP COLUMN "tipoMedicion";

-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "agendaId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
