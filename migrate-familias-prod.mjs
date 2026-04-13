import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  console.log('=== Migración de datos: Area y Familia (por nombres) ===\n')

  const areas = await p.area.findMany()
  const areaByName = Object.fromEntries(areas.map(a => [a.nombre, a.id]))
  console.log('Áreas encontradas:', JSON.stringify(areaByName, null, 2))

  const familiasActuales = await p.familia.findMany({ include: { area: true } })
  console.log('\nFamilias actuales:')
  for (const f of familiasActuales) {
    console.log(`  [${f.id}] ${f.nombre} → ${f.area.nombre}`)
  }

  const findFamilia = (nombre, areaNombre) =>
    familiasActuales.find(f => f.nombre === nombre && f.area.nombre === areaNombre)

  // 1. Mover RCMs de "Testigos Hormigón" → "Hormigón Endurecido"
  const testigos = findFamilia('Testigos Hormigón', 'Hormigón')
  const endurecido = findFamilia('Hormigón Endurecido', 'Hormigón')
  if (testigos && endurecido) {
    const moved = await p.rCM.updateMany({
      where: { familiaId: testigos.id },
      data: { familiaId: endurecido.id }
    })
    console.log(
      `\n1. RCMs movidos de "Testigos Hormigón" (id=${testigos.id}) → "Hormigón Endurecido" (id=${endurecido.id}): ${moved.count}`
    )
  } else {
    console.log('\n1. SKIP: "Testigos Hormigón" y/o "Hormigón Endurecido" no encontradas')
  }

  // 2. Renombrar familias existentes
  const renames = [
    { oldName: 'Controles y Muestreos Terreno', area: 'Suelo', newName: 'Controles Suelo' },
    { oldName: 'Análisis de Suelo', area: 'Suelo', newName: 'Análisis Suelo' },
    { oldName: 'Ensayos de Estructura', area: 'Suelo', newName: 'EMS - Ing' },
    { oldName: 'Hormigón Endurecido', area: 'Hormigón', newName: 'Hormigón Edurecido' },
    { oldName: 'Áridos para Hormigón', area: 'Hormigón', newName: 'Áridos para Hormigón / Mortero' },
    { oldName: 'Control de Mezclas Terreno', area: 'Asfalto', newName: 'Control Terreno Asfalto' },
    { oldName: 'Ensayos de Mezclas Asfálticas', area: 'Asfalto', newName: 'Testigos y Mezclas Asfálticas' },
    { oldName: 'Testigos Y Mezclas', area: 'Asfalto', newName: 'Testigos y Mezclas Asfálticas' },
    { oldName: 'Prefabricados de Hormigón', area: 'Elementos y Componentes', newName: 'Elementos y Componentes' },
    { oldName: 'Adicionales', area: 'Servicios', newName: 'Servicios' }
  ]

  console.log('\n2. Renombrando familias:')
  for (const r of renames) {
    const fam = findFamilia(r.oldName, r.area)
    if (fam) {
      await p.familia.update({ where: { id: fam.id }, data: { nombre: r.newName } })
      console.log(`   OK [${fam.id}] "${r.oldName}" → "${r.newName}" (${r.area})`)
    } else {
      console.log(`   SKIP: "${r.oldName}" en "${r.area}" no encontrada`)
    }
  }

  // 3. Eliminar familias obsoletas (solo si no tienen RCMs)
  const toDelete = [
    { nombre: 'Aridos para Suelos', area: 'Suelo' },
    { nombre: 'Testigos Hormigón', area: 'Hormigón' },
    { nombre: 'Premezcladoras Hormigón', area: 'Hormigón' },
    { nombre: 'Otros Hormigón', area: 'Hormigón' },
    { nombre: 'Otros Asfalto', area: 'Asfalto' },
    { nombre: 'Otros Elementos y Componentes', area: 'Elementos y Componentes' },
    { nombre: 'Profesionales', area: 'Servicios' },
    { nombre: 'Otros Servicios', area: 'Servicios' },
    { nombre: 'Testigos Y Mezclas', area: 'Asfalto' },
    { nombre: 'Muestreo de áridos', area: 'Áridos' },
    { nombre: 'Análisis de áridos', area: 'Áridos' }
  ]

  console.log('\n3. Eliminando familias obsoletas:')
  for (const d of toDelete) {
    const fam = findFamilia(d.nombre, d.area)
    if (fam) {
      const rcmCount = await p.rCM.count({ where: { familiaId: fam.id } })
      if (rcmCount > 0) {
        console.log(`   WARN [${fam.id}] "${d.nombre}" (${d.area}) tiene ${rcmCount} RCMs - NO eliminada`)
      } else {
        await p.familia.delete({ where: { id: fam.id } })
        console.log(`   OK [${fam.id}] "${d.nombre}" (${d.area}) eliminada`)
      }
    } else {
      console.log(`   SKIP: "${d.nombre}" en "${d.area}" no encontrada`)
    }
  }

  // 4. Crear nuevas familias (solo si no existen ya)
  const newFamilias = [
    { nombre: 'Otros', area: 'Suelo' },
    { nombre: 'Dosificaciones Hormigón', area: 'Hormigón' },
    { nombre: 'Otros', area: 'Hormigón' },
    { nombre: 'Dosificaciones Asfalto', area: 'Asfalto' },
    { nombre: 'Otros', area: 'Asfalto' },
    { nombre: 'Análisis de Áridos', area: 'Áridos' },
    { nombre: 'Otros', area: 'Áridos' },
    { nombre: 'Otros', area: 'Otros' }
  ]

  const familiasPostRename = await p.familia.findMany({ include: { area: true } })
  const findPost = (nombre, areaNombre) =>
    familiasPostRename.find(f => f.nombre === nombre && f.area.nombre === areaNombre)

  console.log('\n4. Creando nuevas familias:')
  for (const nf of newFamilias) {
    if (findPost(nf.nombre, nf.area)) {
      console.log(`   SKIP: "${nf.nombre}" en "${nf.area}" ya existe`)
      continue
    }
    const areaId = areaByName[nf.area]
    if (!areaId) {
      console.log(`   WARN: Área "${nf.area}" no encontrada`)
      continue
    }
    const created = await p.familia.create({ data: { nombre: nf.nombre, areaId } })
    console.log(`   OK [${created.id}] "${nf.nombre}" (${nf.area}) creada`)
  }

  // 5. Verificación final
  console.log('\n=== Resultado final ===\n')
  const finalAreas = await p.area.findMany({
    include: { familias: { select: { id: true, nombre: true }, orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' }
  })
  for (const area of finalAreas) {
    console.log(`${area.nombre} (id=${area.id}):`)
    for (const f of area.familias) {
      console.log(`  - [${f.id}] ${f.nombre}`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => p.$disconnect())
