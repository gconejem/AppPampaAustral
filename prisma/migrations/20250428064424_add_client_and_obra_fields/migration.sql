/*
  Warnings:

  - The values [VALORES_UNITARIOS,EMS,MENSUAL] on the enum `TipoCotizacion` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoCotizacion_new" AS ENUM ('A', 'B', 'C');
ALTER TABLE "Cotizacion" ALTER COLUMN "tipoCotizacion" DROP DEFAULT;
ALTER TABLE "Cotizacion" ALTER COLUMN "tipoCotizacion" TYPE "TipoCotizacion_new" USING ("tipoCotizacion"::text::"TipoCotizacion_new");
ALTER TYPE "TipoCotizacion" RENAME TO "TipoCotizacion_old";
ALTER TYPE "TipoCotizacion_new" RENAME TO "TipoCotizacion";
DROP TYPE "TipoCotizacion_old";
ALTER TABLE "Cotizacion" ALTER COLUMN "tipoCotizacion" SET DEFAULT 'A';
COMMIT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "emailFacturacion" TEXT,
ADD COLUMN     "giro" TEXT;

-- AlterTable
ALTER TABLE "Cotizacion" ALTER COLUMN "tipoCotizacion" SET DEFAULT 'A';

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "correos" TEXT[];
