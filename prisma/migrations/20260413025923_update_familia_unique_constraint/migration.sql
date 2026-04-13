/*
  Warnings:

  - A unique constraint covering the columns `[nombre,areaId]` on the table `Familia` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Familia_nombre_key";

-- CreateIndex
CREATE UNIQUE INDEX "Familia_nombre_areaId_key" ON "public"."Familia"("nombre", "areaId");
