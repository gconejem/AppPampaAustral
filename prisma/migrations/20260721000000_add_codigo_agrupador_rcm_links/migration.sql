CREATE TABLE "CodigoAgrupadorRcm" (
    "id" SERIAL NOT NULL,
    "codigoAgrupadorId" INTEGER NOT NULL,
    "rcmId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoAgrupadorRcm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CodigoAgrupadorRcm_codigoAgrupadorId_rcmId_key" ON "CodigoAgrupadorRcm"("codigoAgrupadorId", "rcmId");
CREATE INDEX "CodigoAgrupadorRcm_codigoAgrupadorId_idx" ON "CodigoAgrupadorRcm"("codigoAgrupadorId");
CREATE INDEX "CodigoAgrupadorRcm_rcmId_idx" ON "CodigoAgrupadorRcm"("rcmId");

ALTER TABLE "CodigoAgrupadorRcm"
ADD CONSTRAINT "CodigoAgrupadorRcm_codigoAgrupadorId_fkey"
FOREIGN KEY ("codigoAgrupadorId") REFERENCES "CodigoAgrupador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CodigoAgrupadorRcm"
ADD CONSTRAINT "CodigoAgrupadorRcm_rcmId_fkey"
FOREIGN KEY ("rcmId") REFERENCES "RCM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CodigoAgrupadorRcm" ("codigoAgrupadorId", "rcmId")
SELECT "codigoAgrupadorId", "id"
FROM "RCM"
WHERE "codigoAgrupadorId" IS NOT NULL
ON CONFLICT ("codigoAgrupadorId", "rcmId") DO NOTHING;
