CREATE TABLE "ReferenciaLbotmae" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "item" TEXT,
    "procedencia" TEXT,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenciaLbotmae_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferenciaLbotmae_obraId_codigo_key" ON "ReferenciaLbotmae"("obraId", "codigo");
CREATE INDEX "ReferenciaLbotmae_estado_idx" ON "ReferenciaLbotmae"("estado");
ALTER TABLE "ReferenciaLbotmae" ADD CONSTRAINT "ReferenciaLbotmae_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE CASCADE ON UPDATE CASCADE;
