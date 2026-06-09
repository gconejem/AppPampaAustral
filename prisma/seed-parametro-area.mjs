// Script idempotente para poblar la tabla ParametroArea.
// Funciona tanto en desarrollo como en producción (resuelve IDs por nombre de área).
// Uso: node prisma/seed-parametro-area.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ─── MATERIALES por área ───
  const materiales = {
    Suelo: [
      'Grava Mal Graduada',
      'Arena Mal Graduada',
      'Limo',
      'Arcilla',
      'Maicillo',
      'Material Integral',
      'Chuzca',
      'Bloques',
      'Bolones',
      'Conchilla',
      'Escoria alto horno',
      'Balasto'
    ],
    Hormigón: [
      'Cubos 15 x 15',
      'Cubos 20 x 20',
      'Probeta Cilíndrica',
      'Rilem',
      'Testigos Hormigón',
      'Vigas Prismáticas',
      'Bandeja Schotcrette',
      'Árido'
    ],
    Asfalto: ['Mezclas en caliente', 'Mezclas en frío', 'Testigos Asfalto', 'Árido'],
    'Elementos y Componentes': [
      'Solera',
      'Solera Zarpa',
      'Solerilla',
      'Bloques de Hormigón',
      'Adocretos',
      'Ladrillos Arcillosos',
      'Ladrillos Cerámicos',
      'Cunetas',
      'Losas de Hormigón',
      'Locetas de Hormigón',
      'Tapa de Cámara',
      'Baldosa',
      'Muro Prefabricado'
    ],
    Áridos: ['Grava', 'Gravilla', 'Arena', 'Polvo roca']
  }

  // ─── ÍTEMS por área ───
  const items = {
    Suelo: [
      'Sello',
      'Sello Mejorado',
      'Subrasante',
      'Subrasante Mejorada',
      'Terraplén',
      'Relleno Estructural',
      'Sub-base Granular',
      'Base Estabilizada (químico)',
      'Base Granular'
    ],
    Hormigón: [
      'Cimiento',
      'Sobrecimiento',
      'Radier',
      'Losa',
      'Vigas',
      'Cadenas',
      'Columna / Pilar',
      'Muro',
      'Fundación',
      'Zapata',
      'Pavimento',
      'Pilote',
      'Estribo',
      'Dado de fundación',
      'Muro de Alas',
      'Tubería HC',
      'Árido Grueso (Grava)',
      'Árido Mediano (Gravilla)',
      'Árido Fino (Arena)',
      'Árido Polvo Roca'
    ],
    Áridos: ['Árido Grueso (Grava)', 'Árido Mediano (Gravilla)', 'Árido Fino (Arena)', 'Árido Polvo Roca'],
    Asfalto: [
      'Sello Bituminoso',
      'Riego de Imprimación',
      'Riego de Liga',
      'Base Asfáltica (BAGA)',
      'Open Grade',
      'Capa Intermedia (Binder)',
      'Capa de Rodadura',
      'Árido para Mezclas',
      'Doble Tratamiento',
      'Lechada Asfáltica'
    ],
    'Elementos y Componentes': [
      'Solera',
      'Solera Zarpa',
      'Solerilla',
      'Bloques de Hormigón',
      'Adocretos',
      'Ladrillos Arcillosos',
      'Ladrillos Cerámicos',
      'Cunetas',
      'Losas de Hormigón',
      'Locetas de Hormigón',
      'Tapa de Cámara',
      'Baldosa',
      'Muro Prefabricado'
    ],
    Servicios: ['Movilización', 'Jornada Laboratorista', 'Informe de Ingeniería'],
    Otros: ['Pintura', 'Galvanizado']
  }

  // ─── GRADOS (solo para área Hormigón) ───
  const grados = {
    Hormigón: [
      'H-5',
      'H-10',
      'H-12',
      'H-15',
      'H-20',
      'H-25',
      'H-30',
      'H-35',
      'H-40',
      'G-05',
      'G-10',
      'G-12',
      'G-15',
      'G-17',
      'G-20',
      'G-25',
      'G-30',
      'G-35',
      'G-40',
      'G-45',
      'G-50',
      'HF-3,8',
      'HF-4',
      'HF-4.2',
      'HF-4,5',
      'HF-4.8',
      'HF-5',
      'HF-5,5',
      'M 1:2',
      'M 1:3',
      'M 1:4'
    ]
  }

  // Resolver IDs de áreas por nombre
  const areasDb = await prisma.area.findMany()
  const areaMap = {}
  for (const a of areasDb) {
    areaMap[a.nombre] = a.id
  }

  let created = 0
  let skipped = 0

  // Insertar MATERIALES
  for (const [areaNombre, descripciones] of Object.entries(materiales)) {
    const areaId = areaMap[areaNombre]
    if (!areaId) {
      console.warn(`⚠ Área "${areaNombre}" no encontrada, saltando materiales.`)
      continue
    }
    for (const descripcion of descripciones) {
      try {
        await prisma.parametroArea.upsert({
          where: { areaId_tipo_descripcion: { areaId, tipo: 'MATERIAL', descripcion } },
          update: {},
          create: { areaId, tipo: 'MATERIAL', descripcion }
        })
        created++
      } catch (e) {
        skipped++
      }
    }
  }

  // Insertar ÍTEMS
  for (const [areaNombre, descripciones] of Object.entries(items)) {
    const areaId = areaMap[areaNombre]
    if (!areaId) {
      console.warn(`⚠ Área "${areaNombre}" no encontrada, saltando ítems.`)
      continue
    }
    for (const descripcion of descripciones) {
      try {
        await prisma.parametroArea.upsert({
          where: { areaId_tipo_descripcion: { areaId, tipo: 'ITEM', descripcion } },
          update: {},
          create: { areaId, tipo: 'ITEM', descripcion }
        })
        created++
      } catch (e) {
        skipped++
      }
    }
  }

  // Insertar GRADOS
  for (const [areaNombre, descripciones] of Object.entries(grados)) {
    const areaId = areaMap[areaNombre]
    if (!areaId) {
      console.warn(`⚠ Área "${areaNombre}" no encontrada, saltando grados.`)
      continue
    }
    for (const descripcion of descripciones) {
      try {
        await prisma.parametroArea.upsert({
          where: { areaId_tipo_descripcion: { areaId, tipo: 'GRADO', descripcion } },
          update: {},
          create: { areaId, tipo: 'GRADO', descripcion }
        })
        created++
      } catch (e) {
        skipped++
      }
    }
  }

  console.log(`✅ Seed completado: ${created} registros procesados, ${skipped} errores/duplicados.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
