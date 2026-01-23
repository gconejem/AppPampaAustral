-- CreateTable
CREATE TABLE "public"."SubMuestra" (
    "id" SERIAL NOT NULL,
    "IdSubmuestra" TEXT,
    "fechaConfeccion" TIMESTAMP(3),
    "cantidad" INTEGER,
    "dias" INTEGER,
    "fechaVencimiento" TIMESTAMP(3),
    "estadoOperativo" TEXT,

    CONSTRAINT "SubMuestra_pkey" PRIMARY KEY ("id")
);
