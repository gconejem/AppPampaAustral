CREATE TABLE "ReferenciaDensidad" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "item" TEXT,
    "procedencia" TEXT,
    "ubicacion" TEXT,
    "proctor" DOUBLE PRECISION,
    "humedad" DOUBLE PRECISION,
    "densidadMin" DOUBLE PRECISION,
    "densidadMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenciaDensidad_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferenciaDensidad_obraId_codigo_key" ON "ReferenciaDensidad"("obraId", "codigo");
CREATE INDEX "ReferenciaDensidad_obraId_fecha_idx" ON "ReferenciaDensidad"("obraId", "fecha");
ALTER TABLE "ReferenciaDensidad" ADD CONSTRAINT "ReferenciaDensidad_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE CASCADE ON UPDATE CASCADE;
