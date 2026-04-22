/**
 * Agrega la familia "Áridos" al área "Hormigón".
 *
 * Idempotente: busca por nombre (no por id), por lo que funciona
 * tanto en desarrollo como en producción, donde los ids pueden diferir.
 *
 * Uso:
 *   node scripts/add-familia-aridos-hormigon.mjs
 *
 * En producción, asegúrate de tener DATABASE_URL apuntando a prod antes
 * de ejecutar (p. ej. usar .env.production o exportar la variable).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const AREA_NOMBRE = 'Hormigón'
const FAMILIA_NOMBRE = 'Áridos'

async function main() {
  console.log(`=== Agregar familia "${FAMILIA_NOMBRE}" al área "${AREA_NOMBRE}" ===\n`)

  const area = await prisma.area.findUnique({ where: { nombre: AREA_NOMBRE } })

  if (!area) {
    console.error(`ERROR: No existe el área "${AREA_NOMBRE}".`)
    process.exit(1)
  }

  console.log(`Área encontrada: [${area.id}] ${area.nombre}`)

  const existente = await prisma.familia.findUnique({
    where: { nombre_areaId: { nombre: FAMILIA_NOMBRE, areaId: area.id } }
  })

  if (existente) {
    console.log(`SKIP: La familia "${FAMILIA_NOMBRE}" ya existe en "${AREA_NOMBRE}" (id=${existente.id}).`)
    return
  }

  const creada = await prisma.familia.create({
    data: { nombre: FAMILIA_NOMBRE, areaId: area.id }
  })

  console.log(`OK: Familia creada [${creada.id}] "${creada.nombre}" en "${AREA_NOMBRE}".`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
