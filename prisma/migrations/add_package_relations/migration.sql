-- Agregar nuevas columnas a DetalleCotizacion
ALTER TABLE "DetalleCotizacion"
ADD COLUMN IF NOT EXISTS "esPaquete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "esSubProducto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "paqueteId" INTEGER;

-- Agregar índices
CREATE INDEX IF NOT EXISTS "DetalleCotizacion_cotizacionId_idx" ON "DetalleCotizacion"("cotizacionId");
CREATE INDEX IF NOT EXISTS "DetalleCotizacion_productoId_idx" ON "DetalleCotizacion"("productoId");
CREATE INDEX IF NOT EXISTS "DetalleCotizacion_paqueteId_idx" ON "DetalleCotizacion"("paqueteId");

-- Agregar foreign key para la relación de paquetes
ALTER TABLE "DetalleCotizacion"
ADD CONSTRAINT "DetalleCotizacion_paqueteId_fkey"
FOREIGN KEY ("paqueteId")
REFERENCES "DetalleCotizacion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar nueva columna a ProductoPaquete
ALTER TABLE "ProductoPaquete"
ADD COLUMN IF NOT EXISTS "precioUnitario" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Agregar índices a ProductoPaquete
CREATE INDEX IF NOT EXISTS "ProductoPaquete_paqueteId_idx" ON "ProductoPaquete"("paqueteId");
CREATE INDEX IF NOT EXISTS "ProductoPaquete_productoId_idx" ON "ProductoPaquete"("productoId");

-- Agregar índices a Producto
CREATE INDEX IF NOT EXISTS "Producto_sku_idx" ON "Producto"("sku");
CREATE INDEX IF NOT EXISTS "Producto_estado_idx" ON "Producto"("estado");
CREATE INDEX IF NOT EXISTS "Producto_familia_idx" ON "Producto"("familia");
CREATE INDEX IF NOT EXISTS "Producto_area_idx" ON "Producto"("area");

-- Agregar nuevas columnas a Cotizacion para manejar contactos
ALTER TABLE "Cotizacion"
ADD COLUMN IF NOT EXISTS "clienteContactoId" INTEGER,
ADD CONSTRAINT "Cotizacion_clienteContactoId_fkey"
FOREIGN KEY ("clienteContactoId")
REFERENCES "ClienteContacto"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Cotizacion_clienteContactoId_idx" ON "Cotizacion"("clienteContactoId");
