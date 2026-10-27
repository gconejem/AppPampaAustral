INSERT INTO "ParametroArea" ("areaId", "tipo", "descripcion", "updatedAt")
SELECT area."id", parametro."tipo", parametro."descripcion", NOW()
FROM "Area" AS area
CROSS JOIN (VALUES
    ('ITEM', 'Hormigón de Prueba'),
    ('GRADO', 'No aplica')
) AS parametro("tipo", "descripcion")
WHERE area."nombre" = 'Hormigón'
ON CONFLICT ("areaId", "tipo", "descripcion") DO NOTHING;
