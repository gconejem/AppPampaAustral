/*
  Warnings:

  - A unique constraint covering the columns `[tipo]` on the table `TipoEquipo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tipoEquipoId` to the `Equipo` table without a default value. This is not possible if the table is not empty.

*/

-- First, add unique constraint to TipoEquipo.tipo
CREATE UNIQUE INDEX "TipoEquipo_tipo_key" ON "TipoEquipo"("tipo");

-- Insert the required equipment types
INSERT INTO "TipoEquipo" ("tipo") VALUES 
  ('Cono de Abrams'),
  ('Densímetro'),
  ('Otro'),
  ('Prensa'),
  ('Pie de Metro'),
  ('Balanza'),
  ('Testiguera')
ON CONFLICT ("tipo") DO NOTHING;

-- Add the new columns to Equipo table (tipoEquipoId will be added later)
ALTER TABLE "Equipo" ADD COLUMN "funcionarioAsignadoId" TEXT,
ADD COLUMN "observaciones" TEXT,
ADD COLUMN "serie" TEXT,
ALTER COLUMN "estado" SET DEFAULT 'Activo',
ALTER COLUMN "estado" SET DATA TYPE TEXT;

-- Add tipoEquipoId column with a temporary default
ALTER TABLE "Equipo" ADD COLUMN "tipoEquipoId" INTEGER;

-- Update existing equipment with default type "Otro"
UPDATE "Equipo" SET "tipoEquipoId" = (SELECT "id" FROM "TipoEquipo" WHERE "tipo" = 'Otro' LIMIT 1)
WHERE "tipoEquipoId" IS NULL;

-- Now make tipoEquipoId NOT NULL
ALTER TABLE "Equipo" ALTER COLUMN "tipoEquipoId" SET NOT NULL;

-- Create indexes
CREATE INDEX "Equipo_tipoEquipoId_idx" ON "Equipo"("tipoEquipoId");
CREATE INDEX "Equipo_funcionarioAsignadoId_idx" ON "Equipo"("funcionarioAsignadoId");

-- Add foreign key constraints
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_tipoEquipoId_fkey" FOREIGN KEY ("tipoEquipoId") REFERENCES "TipoEquipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_funcionarioAsignadoId_fkey" FOREIGN KEY ("funcionarioAsignadoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
