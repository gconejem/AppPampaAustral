import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTipoOrdenTrabajo() {
  console.log('🌱 Seeding TipoOrdenTrabajo...')

  const tiposOrdenTrabajo = [
    { id: 1, codigo: 'R-12-03', descripcion: 'Control de Compactación' },
    { id: 2, codigo: 'R-12-39', descripcion: 'Muestreo de Hormigón Fresco' },
    { id: 3, codigo: 'R-12-99', descripcion: 'Retiro de Probeta Hormigón' },
    { id: 4, codigo: 'R-12-27', descripcion: 'Muestreo de Materiales' },
    { id: 5, codigo: 'R-12-58', descripcion: 'Testigos' },
    { id: 6, codigo: 'R-12-31', descripcion: 'Extracción Asfáltica' },
    { id: 7, codigo: 'R-12-69', descripcion: 'Dosificación' },
    { id: 8, codigo: 'R-12-34', descripcion: 'General' },
    { id: 9, codigo: 'X-1', descripcion: 'Suspendido en Terreno' }
  ]

  for (const tipo of tiposOrdenTrabajo) {
    await prisma.tipoOrdenTrabajo.upsert({
      where: { id: tipo.id },
      update: {
        codigo: tipo.codigo,
        descripcion: tipo.descripcion
      },
      create: {
        id: tipo.id,
        codigo: tipo.codigo,
        descripcion: tipo.descripcion
      }
    })
  }

  console.log('✅ TipoOrdenTrabajo seeded successfully')
}

async function main() {
  try {
    await seedTipoOrdenTrabajo()
  } catch (error) {
    console.error('❌ Error seeding TipoOrdenTrabajo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
