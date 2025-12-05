-- CreateTable
CREATE TABLE "public"."CalibracionEquipo" (
    "id" SERIAL NOT NULL,
    "fechaCalibracion" TIMESTAMP(3) NOT NULL,
    "certificado" TEXT NOT NULL,
    "equipoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibracionEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DetalleCalibracion" (
    "id" SERIAL NOT NULL,
    "datoEquipo" TEXT NOT NULL,
    "correccion" TEXT NOT NULL,
    "calibracionEquipoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleCalibracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalibracionEquipo_equipoId_idx" ON "public"."CalibracionEquipo"("equipoId");

-- CreateIndex
CREATE INDEX "DetalleCalibracion_calibracionEquipoId_idx" ON "public"."DetalleCalibracion"("calibracionEquipoId");

-- AddForeignKey
ALTER TABLE "public"."CalibracionEquipo" ADD CONSTRAINT "CalibracionEquipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "public"."Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleCalibracion" ADD CONSTRAINT "DetalleCalibracion_calibracionEquipoId_fkey" FOREIGN KEY ("calibracionEquipoId") REFERENCES "public"."CalibracionEquipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
