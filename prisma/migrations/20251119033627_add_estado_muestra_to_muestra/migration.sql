-- AlterTable
ALTER TABLE "public"."Muestra" ADD COLUMN     "estadoMuestra" TEXT;

-- AlterTable
ALTER TABLE "public"."ServicioMuestraHistorial" RENAME CONSTRAINT "servicio_muestra_historial_pkey" TO "ServicioMuestraHistorial_pkey";

-- RenameForeignKey
ALTER TABLE "public"."ServicioMuestraHistorial" RENAME CONSTRAINT "servicio_muestra_historial_servicioMuestraId_fkey" TO "ServicioMuestraHistorial_servicioMuestraId_fkey";

-- RenameIndex
ALTER INDEX "public"."servicio_muestra_historial_fechaAccion_idx" RENAME TO "ServicioMuestraHistorial_fechaAccion_idx";

-- RenameIndex
ALTER INDEX "public"."servicio_muestra_historial_servicioMuestraId_idx" RENAME TO "ServicioMuestraHistorial_servicioMuestraId_idx";

-- RenameIndex
ALTER INDEX "public"."servicio_muestra_historial_tipo_idx" RENAME TO "ServicioMuestraHistorial_tipo_idx";
