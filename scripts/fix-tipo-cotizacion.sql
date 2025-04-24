-- Actualizar todos los valores inválidos a VALORES_UNITARIOS
UPDATE "Cotizacion"
SET "tipoCotizacion" = 'VALORES_UNITARIOS'
WHERE "tipoCotizacion" NOT IN ('VALORES_UNITARIOS', 'EMS', 'MENSUAL');
