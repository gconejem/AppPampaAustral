-- CreateTable
CREATE TABLE "public"."RCMTecnica" (
    "id" SERIAL NOT NULL,
    "fechaCodificacion" TIMESTAMP(3),
    "fechaMuestreo" TIMESTAMP(3),
    "fechaIngreso" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "areaId" INTEGER,
    "tipoServicio" INTEGER,
    "tipoMuestra" TEXT,
    "numeroTarjeta" INTEGER,
    "tipoMaterial" INTEGER,
    "item" INTEGER,
    "elemento" TEXT,
    "grado" INTEGER,
    "cota1" INTEGER,
    "cota2" INTEGER,
    "procedencia" TEXT,
    "ubicacion" TEXT,
    "cantidadMuestras" INTEGER,
    "vencimiento" BOOLEAN,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RCMTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RCMTecnicaServicio" (
    "id" SERIAL NOT NULL,
    "rcmTecnicaId" INTEGER NOT NULL,
    "idProducto" INTEGER,
    "cantidad" INTEGER,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RCMTecnicaServicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RCMTecnica_areaId_idx" ON "public"."RCMTecnica"("areaId");

-- CreateIndex
CREATE INDEX "RCMTecnicaServicio_rcmTecnicaId_idx" ON "public"."RCMTecnicaServicio"("rcmTecnicaId");

-- CreateIndex
CREATE INDEX "RCMTecnicaServicio_idProducto_idx" ON "public"."RCMTecnicaServicio"("idProducto");

-- AddForeignKey
ALTER TABLE "public"."RCMTecnica" ADD CONSTRAINT "RCMTecnica_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RCMTecnicaServicio" ADD CONSTRAINT "RCMTecnicaServicio_rcmTecnicaId_fkey" FOREIGN KEY ("rcmTecnicaId") REFERENCES "public"."RCMTecnica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RCMTecnicaServicio" ADD CONSTRAINT "RCMTecnicaServicio_idProducto_fkey" FOREIGN KEY ("idProducto") REFERENCES "public"."Producto"("productoId") ON DELETE SET NULL ON UPDATE CASCADE;
