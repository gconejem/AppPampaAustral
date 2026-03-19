/*
  Warnings:

  - You are about to drop the `RCMTecnica` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RCMTecnicaServicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubMuestra` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RCMTecnica" DROP CONSTRAINT "RCMTecnica_areaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RCMTecnicaServicio" DROP CONSTRAINT "RCMTecnicaServicio_idProducto_fkey";

-- DropForeignKey
ALTER TABLE "public"."RCMTecnicaServicio" DROP CONSTRAINT "RCMTecnicaServicio_rcmTecnicaId_fkey";

-- AlterTable
ALTER TABLE "public"."RCM" ADD COLUMN     "areaId" INTEGER,
ADD COLUMN     "cantidadMuestras" INTEGER,
ADD COLUMN     "codigoAgrupadorId" INTEGER,
ADD COLUMN     "codigoProducto" TEXT,
ADD COLUMN     "cota1" TEXT,
ADD COLUMN     "cota2" TEXT,
ADD COLUMN     "elemento" TEXT,
ADD COLUMN     "familiaId" INTEGER,
ADD COLUMN     "fechaConfeccion" TIMESTAMP(3),
ADD COLUMN     "fechaServicio" TIMESTAMP(3),
ADD COLUMN     "grado" TEXT,
ADD COLUMN     "informeEnsayo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "item" TEXT,
ADD COLUMN     "numeroTarjeta" TEXT,
ADD COLUMN     "observacionItem" TEXT,
ADD COLUMN     "procedencia" TEXT,
ADD COLUMN     "rcmType" TEXT,
ADD COLUMN     "sede" TEXT,
ADD COLUMN     "tipoMaterial" TEXT,
ADD COLUMN     "tomaMuestra" TEXT,
ADD COLUMN     "ubicacionSector" TEXT,
ADD COLUMN     "vencimiento" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."ServicioRCM" ADD COLUMN     "esPaquete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estadoOperativo" TEXT,
ADD COLUMN     "norma" TEXT,
ADD COLUMN     "observacion" TEXT;

-- DropTable
DROP TABLE "public"."RCMTecnica";

-- DropTable
DROP TABLE "public"."RCMTecnicaServicio";

-- DropTable
DROP TABLE "public"."SubMuestra";

-- CreateTable
CREATE TABLE "public"."SubProductoServicioRCM" (
    "id" SERIAL NOT NULL,
    "servicioRcmId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "norma" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubProductoServicioRCM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CodigoAgrupador" (
    "id" SERIAL NOT NULL,
    "codigoId" TEXT NOT NULL,
    "codigoNombre" TEXT NOT NULL,
    "descripcionServicio" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "unidad" TEXT NOT NULL DEFAULT 'unid',
    "facturacion" TEXT NOT NULL DEFAULT 'Unitario',
    "ordenTrabajoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodigoAgrupador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CodigoAgrupadorEnsayo" (
    "id" SERIAL NOT NULL,
    "codigoAgrupadorId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoAgrupadorEnsayo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubProductoServicioRCM_servicioRcmId_idx" ON "public"."SubProductoServicioRCM"("servicioRcmId");

-- CreateIndex
CREATE INDEX "SubProductoServicioRCM_productoId_idx" ON "public"."SubProductoServicioRCM"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoAgrupador_codigoId_key" ON "public"."CodigoAgrupador"("codigoId");

-- CreateIndex
CREATE INDEX "CodigoAgrupador_ordenTrabajoId_idx" ON "public"."CodigoAgrupador"("ordenTrabajoId");

-- CreateIndex
CREATE INDEX "CodigoAgrupadorEnsayo_codigoAgrupadorId_idx" ON "public"."CodigoAgrupadorEnsayo"("codigoAgrupadorId");

-- CreateIndex
CREATE INDEX "CodigoAgrupadorEnsayo_productoId_idx" ON "public"."CodigoAgrupadorEnsayo"("productoId");

-- CreateIndex
CREATE INDEX "RCM_areaId_idx" ON "public"."RCM"("areaId");

-- CreateIndex
CREATE INDEX "RCM_familiaId_idx" ON "public"."RCM"("familiaId");

-- CreateIndex
CREATE INDEX "RCM_codigoAgrupadorId_idx" ON "public"."RCM"("codigoAgrupadorId");

-- CreateIndex
CREATE INDEX "RCM_ordenTrabajoId_idx" ON "public"."RCM"("ordenTrabajoId");

-- AddForeignKey
ALTER TABLE "public"."RCM" ADD CONSTRAINT "RCM_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RCM" ADD CONSTRAINT "RCM_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "public"."Familia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RCM" ADD CONSTRAINT "RCM_codigoAgrupadorId_fkey" FOREIGN KEY ("codigoAgrupadorId") REFERENCES "public"."CodigoAgrupador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubProductoServicioRCM" ADD CONSTRAINT "SubProductoServicioRCM_servicioRcmId_fkey" FOREIGN KEY ("servicioRcmId") REFERENCES "public"."ServicioRCM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubProductoServicioRCM" ADD CONSTRAINT "SubProductoServicioRCM_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodigoAgrupador" ADD CONSTRAINT "CodigoAgrupador_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "public"."OrdenTrabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodigoAgrupadorEnsayo" ADD CONSTRAINT "CodigoAgrupadorEnsayo_codigoAgrupadorId_fkey" FOREIGN KEY ("codigoAgrupadorId") REFERENCES "public"."CodigoAgrupador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodigoAgrupadorEnsayo" ADD CONSTRAINT "CodigoAgrupadorEnsayo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;
