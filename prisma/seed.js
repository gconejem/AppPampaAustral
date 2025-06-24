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
    { nombre: 'Controles y Muestreos Terreno', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Análisis de Suelo', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Mecánica de Suelo', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Ensayos de Estructura', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },
    { nombre: 'Aridos para Suelos', areaId: areasCreadas.find(a => a.nombre === 'Suelo')?.id },

    // Hormigón
    { nombre: 'Hormigón Fresco', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Hormigón Endurecido', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Testigos Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Áridos para Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Premezcladoras Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },
    { nombre: 'Otros Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Hormigón')?.id },

    // Asfalto
    { nombre: 'Control de Mezclas Terreno', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Áridos para Asfalto', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Testigos Y Mezclas', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },
    { nombre: 'Otros Asfalto', areaId: areasCreadas.find(a => a.nombre === 'Asfalto')?.id },

    // Elementos y Componentes
    { nombre: 'Prefabricados de Hormigón', areaId: areasCreadas.find(a => a.nombre === 'Elementos y Componentes')?.id },
    { nombre: 'Otros Elementos y Componentes', areaId: areasCreadas.find(a => a.nombre === 'Elementos y Componentes')?.id },

    // Otros
    { nombre: 'Pintura', areaId: areasCreadas.find(a => a.nombre === 'Otros')?.id },

    // Servicios
    { nombre: 'Adicionales', areaId: areasCreadas.find(a => a.nombre === 'Servicios')?.id },
    { nombre: 'Profesionales', areaId: areasCreadas.find(a => a.nombre === 'Servicios')?.id },
    { nombre: 'Otros Servicios', areaId: areasCreadas.find(a => a.nombre === 'Servicios')?.id },

    // Áridos
    { nombre: 'Muestreo de áridos', areaId: areasCreadas.find(a => a.nombre === 'Áridos')?.id },
    { nombre: 'Análisis de áridos', areaId: areasCreadas.find(a => a.nombre === 'Áridos')?.id }
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
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
