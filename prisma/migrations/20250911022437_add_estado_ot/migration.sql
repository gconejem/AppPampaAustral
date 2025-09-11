-- CreateTable
CREATE TABLE "public"."EstadoOT" (
    "id" SERIAL NOT NULL,
    "origen" TEXT,
    "tipoJSON" TEXT,
    "estado" TEXT,

    CONSTRAINT "EstadoOT_pkey" PRIMARY KEY ("id")
);
