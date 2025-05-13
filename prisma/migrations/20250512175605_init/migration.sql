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

-- CreateEnum
CREATE TYPE "EstadoAgenda" AS ENUM ('AGENDADA', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA', 'EN_PROCESO');

-- CreateEnum
CREATE TYPE "TipoOrdenTrabajo" AS ENUM ('ACEPTACION_VISITA', 'DENSIDADES', 'HORMIGON_FRESCO', 'TESTIGOS', 'EXTRACCION_ASFALTICA', 'MUESTREO_MATERIAL', 'RETIRO_PROBETA');

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
    "giro" TEXT,
    "emailFacturacion" TEXT,
    "otroRut" TEXT,
    "representanteLegal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "Contacto" (
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono1" TEXT NOT NULL,
    "telefono2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" SERIAL NOT NULL,
    "comuna" TEXT,
    "direccion" TEXT,
    "empresa" TEXT,
    "cargo" TEXT NOT NULL DEFAULT 'Sin cargo',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',

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
    "contactId" INTEGER NOT NULL,
    "cargo" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "precioUnitario" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "correos" TEXT[],
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
    "envioInformes" BOOLEAN NOT NULL DEFAULT false,
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
    "contactId" INTEGER,

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
    "contactId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formaPago" TEXT,

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
    "esPaquete" BOOLEAN NOT NULL DEFAULT false,
    "esSubProducto" BOOLEAN NOT NULL DEFAULT false,
    "paqueteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" SERIAL NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER,
    "obraId" INTEGER,
    "cotizacionId" INTEGER,
    "observaciones" TEXT,
    "numeroSolicitud" SERIAL NOT NULL,
    "estadoOperativo" "EstadoOperacional" NOT NULL DEFAULT 'PENDIENTE',
    "estadoAdministrativo" "EstadoAdministrativo" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agenda" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipoVisita" TEXT NOT NULL,
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAgenda" NOT NULL DEFAULT 'AGENDADA',
    "clienteId" INTEGER,
    "obraId" INTEGER,
    "solicitudId" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "comuna" TEXT,
    "direccion" TEXT,
    "referencia" TEXT,
    "region" TEXT,
    "sectorComercial" TEXT,
    "horaLlegada" TEXT,
    "horaSalida" TEXT,
    "kmAdicionales" TEXT,
    "movilizacion" TEXT,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaServicio" (
    "id" SERIAL NOT NULL,
    "agendaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "observacion" TEXT,
    "esSegundaVisita" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AgendaServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaAsignado" (
    "id" SERIAL NOT NULL,
    "agendaId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaAsignado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaEquipo" (
    "id" SERIAL NOT NULL,
    "agendaId" INTEGER NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRol" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "rolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRol_pkey" PRIMARY KEY ("id")
);

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
    "agendaId" INTEGER,

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
CREATE INDEX "ProductoPaquete_paqueteId_idx" ON "ProductoPaquete"("paqueteId");

-- CreateIndex
CREATE INDEX "ProductoPaquete_productoId_idx" ON "ProductoPaquete"("productoId");

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
CREATE INDEX "Cotizacion_contactoId_idx" ON "Cotizacion"("contactId");

-- CreateIndex
CREATE INDEX "DetalleCotizacion_cotizacionId_idx" ON "DetalleCotizacion"("cotizacionId");

-- CreateIndex
CREATE INDEX "DetalleCotizacion_productoId_idx" ON "DetalleCotizacion"("productoId");

-- CreateIndex
CREATE INDEX "DetalleCotizacion_paqueteId_idx" ON "DetalleCotizacion"("paqueteId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numeroSolicitud_key" ON "solicitudes"("numeroSolicitud");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_codigo_key" ON "Servicio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_codigo_key" ON "Equipo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaAsignado_agendaId_userId_key" ON "AgendaAsignado"("agendaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaEquipo_agendaId_equipoId_key" ON "AgendaEquipo"("agendaId", "equipoId");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UserRol_userId_rolId_key" ON "UserRol"("userId", "rolId");

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

-- CreateIndex
CREATE UNIQUE INDEX "RCM_numeroRcm_key" ON "RCM"("numeroRcm");

-- CreateIndex
CREATE UNIQUE INDEX "Muestra_numeroMuestra_key" ON "Muestra"("numeroMuestra");

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
ALTER TABLE "ContactoObra" ADD CONSTRAINT "ContactoObra_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoObra" ADD CONSTRAINT "ContactoObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comuna" ADD CONSTRAINT "Comuna_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoListaPrecio" ADD CONSTRAINT "ProductoListaPrecio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_contactoId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_paqueteId_fkey" FOREIGN KEY ("paqueteId") REFERENCES "DetalleCotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaServicio" ADD CONSTRAINT "AgendaServicio_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaAsignado" ADD CONSTRAINT "AgendaAsignado_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaAsignado" ADD CONSTRAINT "AgendaAsignado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEquipo" ADD CONSTRAINT "AgendaEquipo_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEquipo" ADD CONSTRAINT "AgendaEquipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRol" ADD CONSTRAINT "UserRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRol" ADD CONSTRAINT "UserRol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "RCM" ADD CONSTRAINT "RCM_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RCM" ADD CONSTRAINT "RCM_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("obraId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioRCM" ADD CONSTRAINT "ServicioRCM_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioRCM" ADD CONSTRAINT "ServicioRCM_rcmId_fkey" FOREIGN KEY ("rcmId") REFERENCES "RCM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muestra" ADD CONSTRAINT "Muestra_rcmId_fkey" FOREIGN KEY ("rcmId") REFERENCES "RCM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioMuestra" ADD CONSTRAINT "ServicioMuestra_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "Muestra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioMuestra" ADD CONSTRAINT "ServicioMuestra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("productoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Probeta" ADD CONSTRAINT "Probeta_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "Muestra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
