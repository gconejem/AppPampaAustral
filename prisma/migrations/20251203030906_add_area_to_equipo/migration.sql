-- AlterTable
ALTER TABLE "public"."Equipo" ADD COLUMN     "areaId" INTEGER;

-- CreateIndex
CREATE INDEX "Equipo_areaId_idx" ON "public"."Equipo"("areaId");

-- AddForeignKey
ALTER TABLE "public"."Equipo" ADD CONSTRAINT "Equipo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
