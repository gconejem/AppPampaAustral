-- CreateTable
CREATE TABLE "ContactoAgenda" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "email" TEXT,
    "telefono1" TEXT,
    "telefono2" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "agendaId" INTEGER NOT NULL,
    "contactId" INTEGER,

    CONSTRAINT "ContactoAgenda_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactoAgenda" ADD CONSTRAINT "ContactoAgenda_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoAgenda" ADD CONSTRAINT "ContactoAgenda_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
