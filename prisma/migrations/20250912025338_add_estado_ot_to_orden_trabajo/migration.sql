-- AlterTable
ALTER TABLE "public"."OrdenTrabajo" ADD COLUMN     "estadoOTId" INTEGER;

-- CreateIndex
CREATE INDEX "OrdenTrabajo_estadoOTId_idx" ON "public"."OrdenTrabajo"("estadoOTId");

-- AddForeignKey
ALTER TABLE "public"."OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_estadoOTId_fkey" FOREIGN KEY ("estadoOTId") REFERENCES "public"."EstadoOT"("id") ON DELETE SET NULL ON UPDATE CASCADE;
