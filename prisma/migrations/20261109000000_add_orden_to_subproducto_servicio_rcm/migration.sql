-- Preserve the user-selected order of package sub-products for newly created or edited RCMs.
-- Existing rows remain NULL and continue using the legacy createdAt/id ordering.
ALTER TABLE "SubProductoServicioRCM" ADD COLUMN "orden" INTEGER;
