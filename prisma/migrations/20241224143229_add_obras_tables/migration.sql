-- CreateTable
CREATE TABLE "Obra" (
    "obraId" SERIAL NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroObra" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "estadoObra" TEXT NOT NULL,
    "nombreObra" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "telefono" TEXT,
    "sitioWeb" TEXT,
    "informeMandante" BOOLEAN NOT NULL DEFAULT false,
    "textoMandante" TEXT,
    "acreditacionPersonal" BOOLEAN NOT NULL DEFAULT false,
    "especificacionesTecnicas" BOOLEAN NOT NULL DEFAULT false,
    "acreditacionEquipos" BOOLEAN NOT NULL DEFAULT false,
    "cartaCompromiso" BOOLEAN NOT NULL DEFAULT false,
    "mandatoServiu" BOOLEAN NOT NULL DEFAULT false,
    "otrosRequisitos" TEXT,
    "razonSocial" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "giro" TEXT NOT NULL,
    "direccionComercial" TEXT NOT NULL,
    "comunaFacturacion" TEXT NOT NULL,
    "telefonoFacturacion" TEXT NOT NULL,
    "listaPrecios" TEXT NOT NULL,
    "mailRecepcionFactura" TEXT NOT NULL,
    "estadoPago" BOOLEAN NOT NULL DEFAULT false,
    "hes" BOOLEAN NOT NULL DEFAULT false,
    "oc" BOOLEAN NOT NULL DEFAULT false,
    "otrasReferencias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("obraId")
);

-- CreateTable
CREATE TABLE "ContactoObra" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono1" TEXT NOT NULL,
    "telefono2" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactoObra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Obra_numeroObra_key" ON "Obra"("numeroObra");

-- AddForeignKey
ALTER TABLE "ContactoObra" ADD CONSTRAINT "ContactoObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE RESTRICT ON UPDATE CASCADE;
