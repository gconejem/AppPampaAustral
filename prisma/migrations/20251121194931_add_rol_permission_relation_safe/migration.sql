-- AlterTable
ALTER TABLE "public"."Permission" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "descripcion" TEXT;

-- CreateTable
CREATE TABLE "public"."RolPermiso" (
    "id" SERIAL NOT NULL,
    "rolId" INTEGER NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolPermiso_rolId_idx" ON "public"."RolPermiso"("rolId");

-- CreateIndex
CREATE INDEX "RolPermiso_permissionId_idx" ON "public"."RolPermiso"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolPermiso_rolId_permissionId_key" ON "public"."RolPermiso"("rolId", "permissionId");

-- AddForeignKey
ALTER TABLE "public"."RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "public"."Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolPermiso" ADD CONSTRAINT "RolPermiso_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
