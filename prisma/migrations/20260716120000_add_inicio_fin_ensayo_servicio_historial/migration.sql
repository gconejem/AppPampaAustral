-- Agrega marcas de tiempo de inicio/fin de ensayo al historial de servicio de muestra
ALTER TABLE "ServicioMuestraHistorial"
ADD COLUMN "fechaInicioEnsayo" TIMESTAMP(3),
ADD COLUMN "fechaFinEnsayo" TIMESTAMP(3);
