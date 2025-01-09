-- Verificar si las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'region') THEN
        -- CreateTable
        CREATE TABLE "Region" (
            "id" SERIAL NOT NULL,
            "codigo" TEXT NOT NULL,
            "nombre" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE UNIQUE INDEX "Region_codigo_key" ON "Region"("codigo");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comuna') THEN
        -- CreateTable
        CREATE TABLE "Comuna" (
            "id" SERIAL NOT NULL,
            "codigo" TEXT NOT NULL,
            "nombre" TEXT NOT NULL,
            "regionId" INTEGER NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE UNIQUE INDEX "Comuna_codigo_key" ON "Comuna"("codigo");

        -- AddForeignKey
        ALTER TABLE "Comuna" ADD CONSTRAINT "Comuna_regionId_fkey"
        FOREIGN KEY ("regionId") REFERENCES "Region"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
