-- Crear una tabla temporal para los contactos
CREATE TABLE "Contacto_temp" (
    "contactId" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono1" TEXT NOT NULL,
    "telefono2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Copiar los datos de contactos existentes
INSERT INTO "Contacto_temp" ("nombre", "cargo", "email", "telefono1", "telefono2", "createdAt", "updatedAt")
SELECT "nombre", "cargo", "email", "telefono1", COALESCE("telefono2", ''), "createdAt", "updatedAt"
FROM "Contacto";

-- Crear un mapeo temporal de IDs viejos a nuevos
CREATE TABLE "ContactoIdMapping" (
    "old_id" TEXT,
    "new_id" INTEGER NOT NULL,
    PRIMARY KEY ("new_id")
);

-- Insertar el mapeo de IDs
INSERT INTO "ContactoIdMapping" ("old_id", "new_id")
SELECT "contactId", ROW_NUMBER() OVER (ORDER BY "createdAt")
FROM "Contacto";

-- Crear una tabla temporal para almacenar los datos existentes
CREATE TABLE "ClienteContacto_temp" (
    "id" SERIAL PRIMARY KEY,
    "clienteId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copiar los datos de la relación usando el mapeo
INSERT INTO "ClienteContacto_temp" ("clienteId", "contactId", "isPrincipal", "createdAt")
SELECT 
    cc."clienteId", 
    COALESCE(cim."new_id", (SELECT MAX("new_id") + 1 FROM "ContactoIdMapping")), 
    COALESCE(cc."isPrincipal", false), 
    cc."createdAt"
FROM "ClienteContacto" cc
LEFT JOIN "ContactoIdMapping" cim ON cc."contactId" = cim."old_id"
WHERE cc."contactId" IS NOT NULL;

-- Eliminar las tablas originales
DROP TABLE IF EXISTS "ClienteContacto";
DROP TABLE IF EXISTS "Contacto";

-- Renombrar las tablas temporales
ALTER TABLE "Contacto_temp" RENAME TO "Contacto";
ALTER TABLE "ClienteContacto_temp" RENAME TO "ClienteContacto";

-- Recrear los índices y restricciones
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_clienteId_fkey" 
    FOREIGN KEY ("clienteId") REFERENCES "Cliente"("clienteId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_contactId_fkey" 
    FOREIGN KEY ("contactId") REFERENCES "Contacto"("contactId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_clienteId_contactId_key" 
    UNIQUE ("clienteId", "contactId");

-- Limpiar la tabla de mapeo temporal
DROP TABLE "ContactoIdMapping"; 
