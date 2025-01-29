/*
  Warnings:

  - You are about to drop the column `precio` on the `ListaPrecio` table. All the data in the column will be lost.
  - You are about to drop the column `sitioWeb` on the `Obra` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Obra` table. All the data in the column will be lost.
  - You are about to drop the column `listaPrecioId` on the `Producto` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CONVERTIDA');

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_listaPrecioId_fkey";

-- DropIndex
DROP INDEX "ListaPrecio_nombre_key";

-- DropIndex
DROP INDEX "Obra_numeroObra_key";

-- AlterTable
ALTER TABLE "ContactoObra" ADD COLUMN     "telefono2" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "telefono1" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ListaPrecio" DROP COLUMN "precio";

-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "sitioWeb",
DROP COLUMN "telefono",
ALTER COLUMN "estadoObra" DROP DEFAULT,
ALTER COLUMN "razonSocial" DROP NOT NULL,
ALTER COLUMN "giro" DROP NOT NULL,
ALTER COLUMN "direccionComercial" DROP NOT NULL,
ALTER COLUMN "comunaFacturacion" DROP NOT NULL,
ALTER COLUMN "telefonoFacturacion" DROP NOT NULL,
ALTER COLUMN "listaPrecios" DROP NOT NULL,
ALTER COLUMN "mailRecepcionFactura" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "listaPrecioId",
ALTER COLUMN "precio" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProductoListaPrecio" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "listaPrecioId" INTEGER NOT NULL,
    "precio" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoListaPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "numeroCotizacion" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "tipoCotizacion" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "obraId" INTEGER,
    "vendedorId" TEXT,
    "observaciones" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL,
    "impuesto" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "contactoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCotizacion" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductoListaPrecio_productoId_idx" ON "ProductoListaPrecio"("productoId");

-- CreateIndex
CREATE INDEX "ProductoListaPrecio_listaPrecioId_idx" ON "ProductoListaPrecio"("listaPrecioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoListaPrecio_productoId_listaPrecioId_key" ON "ProductoListaPrecio"("productoId", "listaPrecioId");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numeroCotizacion_key" ON "Cotizacion"("numeroCotizacion");

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "ClienteContacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;
