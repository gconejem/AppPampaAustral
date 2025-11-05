-- AlterTable
ALTER TABLE "public"."RCM" ADD COLUMN     "ordenTrabajoId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."RCM" ADD CONSTRAINT "RCM_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "public"."OrdenTrabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
