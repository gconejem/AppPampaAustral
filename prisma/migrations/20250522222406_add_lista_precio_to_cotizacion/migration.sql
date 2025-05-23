-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "listaPrecioId" INTEGER;

-- CreateIndex
CREATE INDEX "Cotizacion_listaPrecioId_idx" ON "Cotizacion"("listaPrecioId");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
