-- AlterTable
ALTER TABLE "Producto" ADD COLUMN "listaPrecioId" INTEGER;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_listaPrecioId_fkey"
FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
