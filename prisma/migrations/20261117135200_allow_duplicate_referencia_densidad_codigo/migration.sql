DROP INDEX "ReferenciaDensidad_obraId_codigo_key";
CREATE INDEX "ReferenciaDensidad_obraId_codigo_idx" ON "ReferenciaDensidad"("obraId", "codigo");
