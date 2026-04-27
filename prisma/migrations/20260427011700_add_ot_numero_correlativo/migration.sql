-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN "numeroCorrelativo" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_numeroCorrelativo_key" ON "OrdenTrabajo"("numeroCorrelativo");

-- CreateTable
CREATE TABLE "OTCorrelativoCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTCorrelativoCounter_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row
INSERT INTO "OTCorrelativoCounter" ("id", "nextValue", "updatedAt") VALUES (1, 0, NOW())
ON CONFLICT ("id") DO NOTHING;
