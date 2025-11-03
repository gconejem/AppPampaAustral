-- CreateTable
CREATE TABLE "public"."RCMHistory" (
    "id" SERIAL NOT NULL,
    "rcmId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "funcionario" TEXT,
    "estAnterior" TEXT,
    "estNuevo" TEXT NOT NULL,
    "informe" INTEGER,
    "fechaAccion" TIMESTAMP(3),
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RCMHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RCMHistory_rcmId_idx" ON "public"."RCMHistory"("rcmId");

-- AddForeignKey
ALTER TABLE "public"."RCMHistory" ADD CONSTRAINT "RCMHistory_rcmId_fkey" FOREIGN KEY ("rcmId") REFERENCES "public"."RCM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
