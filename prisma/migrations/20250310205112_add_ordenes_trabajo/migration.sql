-- CreateEnum
CREATE TYPE "TipoOrdenTrabajo" AS ENUM ('ACEPTACION_VISITA', 'DENSIDADES', 'HORMIGON_FRESCO', 'TESTIGOS', 'EXTRACCION_ASFALTICA', 'MUESTREO_MATERIAL', 'RETIRO_PROBETA');

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "fklbrutas" TEXT NOT NULL,
    "correlativ" TEXT NOT NULL,
    "fklbdocver" TEXT NOT NULL,
    "fklbrutser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "tipoOT" "TipoOrdenTrabajo" NOT NULL,

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AceptacionVisita" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "horaSalida" TEXT,
    "horaLlegada" TEXT,
    "movilizacion" TEXT,
    "emailNotificacion" TEXT,
    "nombrePersonaRecibe" TEXT,
    "rutPersonaRecibe" TEXT,
    "gpsInicio" TEXT,
    "gpsFin" TEXT,
    "horainicio" TIMESTAMP(3),
    "horafin" TIMESTAMP(3),

    CONSTRAINT "AceptacionVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Densidad" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "item" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "controles" JSONB,
    "codigoEquipo" TEXT,
    "descripSuelo" TEXT,
    "listaChequeo" JSONB,
    "tipoMedicion" TEXT,
    "numeroSerie" TEXT,

    CONSTRAINT "Densidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HormigonFresco" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "item" TEXT,
    "clima" TEXT,
    "tAmbiente" DOUBLE PRECISION,
    "tHormigon" DOUBLE PRECISION,
    "numTarjeta" TEXT,
    "tipoHormigon" TEXT,
    "volumenHormigon" DOUBLE PRECISION,
    "cantidadProbetas" INTEGER,
    "conoAsentamiento" DOUBLE PRECISION,
    "elementoHormigonado" TEXT,
    "ubicacionHormigonado" TEXT,
    "caracteristicasMezcla" TEXT,
    "probetas" JSONB,

    CONSTRAINT "HormigonFresco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testigos" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "grado" TEXT,
    "diametro" TEXT,
    "itemTestigo" TEXT,
    "tipoTestigo" TEXT,
    "numeroTarjeta" TEXT,
    "fechaMuestreo" TIMESTAMP(3),
    "tipoPavimento" TEXT,
    "controles" JSONB,

    CONSTRAINT "Testigos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraccionAsfaltica" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "item" TEXT,
    "metodo" TEXT,
    "bitumen" BOOLEAN,
    "cubicidad" BOOLEAN,
    "granulometria" BOOLEAN,
    "fechaMuestreo" TIMESTAMP(3),
    "procedenciaAsfalto" TEXT,
    "controles" JSONB,

    CONSTRAINT "ExtraccionAsfaltica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuestreoMaterial" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "controles" JSONB,
    "obsServicio" TEXT,

    CONSTRAINT "MuestreoMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetiroProbeta" (
    "id" TEXT NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "horaRetiro" TEXT,
    "numTarjeta" TEXT,
    "otMuestreo" TEXT,
    "fechaRetiro" TIMESTAMP(3),
    "tempFinCurado" DOUBLE PRECISION,
    "formaTransporte" TEXT,
    "condicionAlRetirar" TEXT,
    "condicionTransporte" TEXT,

    CONSTRAINT "RetiroProbeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_clave_key" ON "OrdenTrabajo"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "AceptacionVisita_ordenTrabajoId_key" ON "AceptacionVisita"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "Densidad_ordenTrabajoId_key" ON "Densidad"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "HormigonFresco_ordenTrabajoId_key" ON "HormigonFresco"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "Testigos_ordenTrabajoId_key" ON "Testigos"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraccionAsfaltica_ordenTrabajoId_key" ON "ExtraccionAsfaltica"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "MuestreoMaterial_ordenTrabajoId_key" ON "MuestreoMaterial"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "RetiroProbeta_ordenTrabajoId_key" ON "RetiroProbeta"("ordenTrabajoId");

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AceptacionVisita" ADD CONSTRAINT "AceptacionVisita_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Densidad" ADD CONSTRAINT "Densidad_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HormigonFresco" ADD CONSTRAINT "HormigonFresco_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testigos" ADD CONSTRAINT "Testigos_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraccionAsfaltica" ADD CONSTRAINT "ExtraccionAsfaltica_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuestreoMaterial" ADD CONSTRAINT "MuestreoMaterial_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiroProbeta" ADD CONSTRAINT "RetiroProbeta_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
