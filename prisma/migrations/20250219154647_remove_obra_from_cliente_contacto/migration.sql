-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoCotizacion" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'COTIZADA', 'GESTIONADA', 'ACEPTADA', 'SIN_RESPUESTA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoOperacional" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoAdministrativo" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_REVISION');

-- CreateTable
CREATE TABLE "Cliente" (
    "clienteId" SERIAL NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "sitioWeb" TEXT,
    "segmento" TEXT,
    "industria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "Contacto" (
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono1" TEXT NOT NULL,
    "telefono2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" SERIAL NOT NULL,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("contactId")
);

-- CreateTable
CREATE TABLE "CondicionComercial" (
    "id" SERIAL NOT NULL,
    "vendedor" TEXT NOT NULL,
    "condicionVenta" TEXT NOT NULL,
    "observaciones" TEXT,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "CondicionComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteContacto" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "ClienteContacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "productoId" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "area" TEXT,
    "familia" TEXT,
    "esPaquete" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT NOT NULL,
    "precio" DECIMAL(10,2),
    "estado" "EstadoProducto" NOT NULL DEFAULT 'ACTIVO',
    "norma" TEXT,
    "aplicaImpuesto" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("productoId")
);

-- CreateTable
CREATE TABLE "ProductoPaquete" (
    "id" SERIAL NOT NULL,
    "paqueteId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoPaquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "obraId" SERIAL NOT NULL,
    "numeroObra" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "estadoObra" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "razonSocial" TEXT,
    "nombreObra" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "sector" TEXT,
    "georreferencia" TEXT,
    "referencia" TEXT,
    "mandante" TEXT,
    "informeMandante" BOOLEAN NOT NULL DEFAULT false,
    "textoMandante" TEXT,
    "giro" TEXT,
    "direccionComercial" TEXT,
    "comunaFacturacion" TEXT,
    "telefonoFacturacion" TEXT,
    "listaPrecios" TEXT,
    "mailRecepcionFactura" TEXT,
    "acreditacionPersonal" BOOLEAN NOT NULL DEFAULT false,
    "especificacionesTecnicas" BOOLEAN NOT NULL DEFAULT false,
    "acreditacionEquipos" BOOLEAN NOT NULL DEFAULT false,
    "cartaCompromiso" BOOLEAN NOT NULL DEFAULT false,
    "mandatoServiu" BOOLEAN NOT NULL DEFAULT false,
    "otrosRequisitos" TEXT,
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
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "email" TEXT,
    "telefono1" TEXT,
    "telefono2" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "obraId" INTEGER NOT NULL,

    CONSTRAINT "ContactoObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedTo" TEXT[],
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comuna" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaPrecio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListaPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoListaPrecio" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "listaPrecioId" INTEGER NOT NULL,
    "precio" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoListaPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "numeroCotizacion" TEXT NOT NULL,
    "tipoCotizacion" "TipoCotizacion" NOT NULL DEFAULT 'A',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "nombreProyecto" TEXT,
    "empresa" TEXT,
    "ubicacion" TEXT,
    "clienteId" INTEGER,
    "obraId" INTEGER,
    "vendedorId" TEXT,
    "observaciones" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL,
    "impuesto" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "contactoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCotizacion" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" SERIAL NOT NULL,
    "numeroSolicitud" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoOperativo" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "estadoAdministrativo" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "clienteId" INTEGER,
    "obraId" INTEGER,
    "cotizacionId" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "CondicionComercial_clienteId_key" ON "CondicionComercial"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteContacto_clienteId_contactId_key" ON "ClienteContacto"("clienteId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE INDEX "Producto_sku_idx" ON "Producto"("sku");

-- CreateIndex
CREATE INDEX "Producto_estado_idx" ON "Producto"("estado");

-- CreateIndex
CREATE INDEX "Producto_familia_idx" ON "Producto"("familia");

-- CreateIndex
CREATE INDEX "Producto_area_idx" ON "Producto"("area");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoPaquete_paqueteId_productoId_key" ON "ProductoPaquete"("paqueteId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_codigo_key" ON "Region"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_codigo_key" ON "Comuna"("codigo");

-- CreateIndex
CREATE INDEX "Comuna_regionId_idx" ON "Comuna"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoListaPrecio_productoId_listaPrecioId_key" ON "ProductoListaPrecio"("productoId", "listaPrecioId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numeroSolicitud_key" ON "solicitudes"("numeroSolicitud");

-- AddForeignKey
ALTER TABLE "CondicionComercial" ADD CONSTRAINT "CondicionComercial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoPaquete" ADD CONSTRAINT "ProductoPaquete_paqueteId_fkey" FOREIGN KEY ("paqueteId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoPaquete" ADD CONSTRAINT "ProductoPaquete_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoObra" ADD CONSTRAINT "ContactoObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comuna" ADD CONSTRAINT "Comuna_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "ClienteContacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
