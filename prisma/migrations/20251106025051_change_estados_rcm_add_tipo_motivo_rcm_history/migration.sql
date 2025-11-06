/*
  Warnings:

  - You are about to drop the column `estado` on the `RCM` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."RCM" DROP COLUMN "estado",
ADD COLUMN     "estado_administrativo" TEXT,
ADD COLUMN     "estado_operativo" TEXT;

-- AlterTable
ALTER TABLE "public"."RCMHistory" ADD COLUMN     "motivo" TEXT,
ADD COLUMN     "tipo_estado" TEXT;
