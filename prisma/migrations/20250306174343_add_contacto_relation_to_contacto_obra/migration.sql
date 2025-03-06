-- AlterTable
ALTER TABLE "ContactoObra" ADD COLUMN     "contactId" INTEGER;

-- AddForeignKey
ALTER TABLE "ContactoObra" ADD CONSTRAINT "ContactoObra_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE SET NULL ON UPDATE CASCADE;
