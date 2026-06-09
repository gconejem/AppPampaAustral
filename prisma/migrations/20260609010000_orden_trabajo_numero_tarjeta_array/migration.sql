-- AlterTable
ALTER TABLE "OrdenTrabajo"
ALTER COLUMN "numeroTarjeta" TYPE TEXT[]
USING (
  CASE
    WHEN "numeroTarjeta" IS NULL OR BTRIM("numeroTarjeta") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY_REMOVE(REGEXP_SPLIT_TO_ARRAY(BTRIM("numeroTarjeta"), '\s*,\s*'), '')
  END
);

ALTER TABLE "OrdenTrabajo"
ALTER COLUMN "numeroTarjeta" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "numeroTarjeta" SET NOT NULL;
