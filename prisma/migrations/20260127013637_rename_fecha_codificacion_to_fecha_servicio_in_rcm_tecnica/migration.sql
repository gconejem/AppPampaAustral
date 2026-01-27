/*
  Warnings:

  - You are about to drop the column `fechaCodificacion` on the `RCMTecnica` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."RCMTecnica" DROP COLUMN "fechaCodificacion",
ADD COLUMN     "fechaServicio" TIMESTAMP(3);
