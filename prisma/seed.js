const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Crear Áreas

  const areas = [
    { nombre: 'Suelo' },
    { nombre: 'Hormigón' },
    { nombre: 'Asfalto' },
    { nombre: 'Elementos y Componentes' },
    { nombre: 'Otros' },
    { nombre: 'Servicios' },
    { nombre: 'Áridos' }
  ]

  // Crear áreas solo si no existen

  for (const area of areas) {
    try {
      await prisma.area.create({
        data: area
      })
      console.log(`Área "${area.nombre}" creada exitosamente`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Área "${area.nombre}" ya existe, omitiendo...`)
      } else {
        throw error
      }
    }
  }

  // Obtener todas las áreas para usar sus IDs

  const areasCreadas = await prisma.area.findMany()

  // Crear Familias

  const familias = [
    // Suelo
    { nombre: 'Controles Suelo', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Análisis Suelo', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Mecánica de Suelo', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'EMS - Ing', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Otros', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    // Hormigón
    { nombre: 'Hormigón Fresco', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Hormigón Edurecido', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Dosificaciones Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Áridos para Hormigón / Mortero', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Áridos', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Otros', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    // Asfalto
    { nombre: 'Control Terreno Asfalto', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Testigos y Mezclas Asfálticas', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Dosificaciones Asfalto', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Áridos para Asfalto', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Otros', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    // Elementos y Componentes
    { nombre: 'Elementos y Componentes', areaId: areasCreadas.find(a => a.nombre === 'Elementos y Componentes')?.id },
    // Áridos
    { nombre: 'Análisis de Áridos', areaId: areasCreadas.find(a => a.nombre === 'Áridos')?.id },
    { nombre: 'Otros', areaId: areasCreadas.find(a => a.nombre === 'Áridos')?.id },
    // Otros
    { nombre: 'Pintura', areaId: areasCreadas.find(a => a.nombre === 'Otros')?.id },
    { nombre: 'Otros', areaId: areasCreadas.find(a => a.nombre === 'Otros')?.id },
    // Servicios
    { nombre: 'Servicios', areaId: areasCreadas.find(a => a.nombre === 'Servicios')?.id }
  ]

  // Crear familias solo si no existen

  for (const familia of familias) {
    if (familia.areaId) {
      try {
        await prisma.familia.create({
          data: {
            nombre: familia.nombre,
            areaId: familia.areaId
          }
        })
        console.log(`Familia "${familia.nombre}" creada exitosamente`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Familia "${familia.nombre}" ya existe, omitiendo...`)
        } else {
          throw error
        }
      }
    }
  }

  console.log('Seed completado exitosamente')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
