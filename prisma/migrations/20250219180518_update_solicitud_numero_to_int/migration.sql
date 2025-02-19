/*
  Warnings:

  - The `numeroSolicitud` column on the `solicitudes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estadoOperativo` column on the `solicitudes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estadoAdministrativo` column on the `solicitudes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "solicitudes" DROP COLUMN "numeroSolicitud",
ADD COLUMN     "numeroSolicitud" SERIAL NOT NULL,
DROP COLUMN "estadoOperativo",
ADD COLUMN     "estadoOperativo" "EstadoOperacional" NOT NULL DEFAULT 'PENDIENTE',
DROP COLUMN "estadoAdministrativo",
ADD COLUMN     "estadoAdministrativo" "EstadoAdministrativo" NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numeroSolicitud_key" ON "solicitudes"("numeroSolicitud");
