CREATE TABLE "ResultadoEnsayoMuestra" (
    "id" SERIAL NOT NULL,
    "muestraId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "dmcs" DOUBLE PRECISION,
    "drMinima" DOUBLE PRECISION,
    "drMaxima" DOUBLE PRECISION,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoEnsayoMuestra_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResultadoEnsayoMuestra_muestraId_productoId_key" ON "ResultadoEnsayoMuestra"("muestraId", "productoId");
CREATE INDEX "ResultadoEnsayoMuestra_sku_idx" ON "ResultadoEnsayoMuestra"("sku");

ALTER TABLE "ResultadoEnsayoMuestra" ADD CONSTRAINT "ResultadoEnsayoMuestra_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "Muestra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResultadoEnsayoMuestra" ADD CONSTRAINT "ResultadoEnsayoMuestra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;
