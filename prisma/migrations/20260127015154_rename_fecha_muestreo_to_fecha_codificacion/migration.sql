/*
  Warnings:

  - You are about to drop the column `fechaMuestreo` on the `RCMTecnica` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."RCMTecnica" DROP COLUMN "fechaMuestreo",
ADD COLUMN     "fechaCodificacion" TIMESTAMP(3);
