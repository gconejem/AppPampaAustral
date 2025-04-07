-- CreateTable
CREATE TABLE "RCM" (
    "id" SERIAL NOT NULL,
    "numeroRcm" TEXT NOT NULL,
    "fechaCodificacion" TIMESTAMP(3) NOT NULL,
    "fechaMuestreo" TIMESTAMP(3) NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER,
    "obraId" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "RCM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioRCM" (
    "id" SERIAL NOT NULL,
    "rcmId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CODIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioRCM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Muestra" (
    "id" SERIAL NOT NULL,
    "rcmId" INTEGER NOT NULL,
    "numeroMuestra" TEXT NOT NULL,
    "tipoMaterial" TEXT,
    "elemento" TEXT,
    "item" TEXT,
    "grado" TEXT,
    "procedencia" TEXT,
    "cotas" TEXT,
    "ubicacionSector" TEXT,
    "vencimiento" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Muestra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioMuestra" (
    "id" SERIAL NOT NULL,
    "muestraId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CODIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioMuestra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Probeta" (
    "id" SERIAL NOT NULL,
    "muestraId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaConfeccion" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "dias" INTEGER NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CODIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Probeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RCM_numeroRcm_key" ON "RCM"("numeroRcm");

-- CreateIndex
CREATE UNIQUE INDEX "Muestra_numeroMuestra_key" ON "Muestra"("numeroMuestra");

-- AddForeignKey
ALTER TABLE "RCM" ADD CONSTRAINT "RCM_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RCM" ADD CONSTRAINT "RCM_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioRCM" ADD CONSTRAINT "ServicioRCM_rcmId_fkey" FOREIGN KEY ("rcmId") REFERENCES "RCM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioRCM" ADD CONSTRAINT "ServicioRCM_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muestra" ADD CONSTRAINT "Muestra_rcmId_fkey" FOREIGN KEY ("rcmId") REFERENCES "RCM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioMuestra" ADD CONSTRAINT "ServicioMuestra_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "Muestra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioMuestra" ADD CONSTRAINT "ServicioMuestra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Probeta" ADD CONSTRAINT "Probeta_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "Muestra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
