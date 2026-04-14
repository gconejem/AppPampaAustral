-- CreateTable
CREATE TABLE "public"."ParametroArea" (
    "id" SERIAL NOT NULL,
    "areaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametroArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParametroArea_areaId_tipo_idx" ON "public"."ParametroArea"("areaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroArea_areaId_tipo_descripcion_key" ON "public"."ParametroArea"("areaId", "tipo", "descripcion");

-- AddForeignKey
ALTER TABLE "public"."ParametroArea" ADD CONSTRAINT "ParametroArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
