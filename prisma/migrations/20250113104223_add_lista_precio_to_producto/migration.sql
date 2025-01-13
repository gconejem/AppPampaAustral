/*
  Warnings:

  - You are about to drop the column `listaPrecios` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the `PrecioProducto` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `ListaPrecio` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PrecioProducto" DROP CONSTRAINT "PrecioProducto_listaPrecioId_fkey";

-- DropForeignKey
ALTER TABLE "PrecioProducto" DROP CONSTRAINT "PrecioProducto_productoId_fkey";

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "listaPrecios",
ADD COLUMN     "listaPrecioId" INTEGER;

-- DropTable
DROP TABLE "PrecioProducto";

-- CreateIndex
CREATE UNIQUE INDEX "ListaPrecio_nombre_key" ON "ListaPrecio"("nombre");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
