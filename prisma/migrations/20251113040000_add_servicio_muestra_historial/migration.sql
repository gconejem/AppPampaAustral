-- CreateTable
CREATE TABLE "servicio_muestra_historial" (
    "id" SERIAL NOT NULL,
    "servicioMuestraId" INTEGER NOT NULL,
    "registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "funcionario" TEXT,
    "aplicadoA" TEXT,
    "ensayoServicio" TEXT,
    "tipo" TEXT,
    "estAnterior" TEXT,
    "estNuevo" TEXT,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    "motivo" TEXT,
    "informe" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicio_muestra_historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicio_muestra_historial_servicioMuestraId_idx" ON "servicio_muestra_historial"("servicioMuestraId");

-- CreateIndex
CREATE INDEX "servicio_muestra_historial_fechaAccion_idx" ON "servicio_muestra_historial"("fechaAccion");

-- CreateIndex
CREATE INDEX "servicio_muestra_historial_tipo_idx" ON "servicio_muestra_historial"("tipo");

-- AddForeignKey
ALTER TABLE "servicio_muestra_historial" ADD CONSTRAINT "servicio_muestra_historial_servicioMuestraId_fkey" FOREIGN KEY ("servicioMuestraId") REFERENCES "ServicioMuestra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
