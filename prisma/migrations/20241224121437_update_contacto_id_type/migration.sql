/*
  Warnings:

  - The primary key for the `Contacto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `contactId` column on the `Contacto` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `contactId` on the `ClienteContacto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ClienteContacto" DROP CONSTRAINT "ClienteContacto_contactId_fkey";

-- AlterTable
ALTER TABLE "ClienteContacto" DROP COLUMN "contactId",
ADD COLUMN     "contactId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Contacto" DROP CONSTRAINT "Contacto_pkey",
DROP COLUMN "contactId",
ADD COLUMN     "contactId" SERIAL NOT NULL,
ADD CONSTRAINT "Contacto_pkey" PRIMARY KEY ("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteContacto_clienteId_contactId_key" ON "ClienteContacto"("clienteId", "contactId");

-- AddForeignKey
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE RESTRICT ON UPDATE CASCADE;
