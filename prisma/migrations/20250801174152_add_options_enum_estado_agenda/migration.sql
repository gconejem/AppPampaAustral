/*
  Warnings:

  - The values [CANCELADA,EN_PROCESO] on the enum `EstadoAgenda` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoAgenda_new" AS ENUM ('CREADA', 'ELIMINADA', 'AGENDADA', 'SUSPENDIDA', 'SUSPENDIDA_TERRENO', 'COMPLETADA', 'EN_REVISION', 'ANULADA', 'RECIBIDA_OK', 'CODIFICADA');
ALTER TABLE "Agenda" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Agenda" ALTER COLUMN "estado" TYPE "EstadoAgenda_new" USING ("estado"::text::"EstadoAgenda_new");
ALTER TYPE "EstadoAgenda" RENAME TO "EstadoAgenda_old";
ALTER TYPE "EstadoAgenda_new" RENAME TO "EstadoAgenda";
DROP TYPE "EstadoAgenda_old";
ALTER TABLE "Agenda" ALTER COLUMN "estado" SET DEFAULT 'CREADA';
COMMIT;

-- AlterTable
ALTER TABLE "Agenda" ALTER COLUMN "estado" SET DEFAULT 'CREADA';
