/*
  Warnings:

  - You are about to alter the column `subtotal` on the `Cotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `descuento` on the `Cotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `impuesto` on the `Cotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `total` on the `Cotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `precioUnitario` on the `DetalleCotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `descuento` on the `DetalleCotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `subtotal` on the `DetalleCotizacion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `precio` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `precio` on the `ProductoListaPrecio` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to alter the column `precioUnitario` on the `ProductoPaquete` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE "Cotizacion" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "descuento" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "impuesto" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "DetalleCotizacion" ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "descuento" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "precio" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ProductoListaPrecio" ALTER COLUMN "precio" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ProductoPaquete" ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(10,3);
