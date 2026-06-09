INSERT INTO "ParametroArea" ("areaId", "tipo", "descripcion", "updatedAt")
SELECT "id", 'MATERIAL', 'Árido', NOW()
FROM "Area"
WHERE "nombre" IN ('Hormigón', 'Asfalto')
ON CONFLICT ("areaId", "tipo", "descripcion") DO NOTHING;
