-- Preserve the user-selected order of services for newly created or edited RCMs.
-- Existing rows remain NULL and continue using the legacy createdAt/id ordering.
ALTER TABLE "ServicioRCM" ADD COLUMN "orden" INTEGER;
ALTER TABLE "ServicioMuestra" ADD COLUMN "orden" INTEGER;
