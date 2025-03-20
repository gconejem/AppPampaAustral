const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Buscar la agenda específica
    const agenda = await prisma.agenda.findUnique({
      where: {
        id: 11
      }
    })

    if (!agenda) {
      throw new Error('No se encontró la agenda con ID 11')
    }

    // Buscar un usuario laboratorista
    const user = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            rol: {
              nombre: 'LABORATORISTA'
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error('No se encontró ningún laboratorista')
    }

    // Usar executeRaw para evitar problemas con el enum
    // OT para Control de Compactación usando DENSIDADES
    await prisma.$executeRaw`
      INSERT INTO "OrdenTrabajo" ("id", "clave", "estado", "origen", "fklbrutas", "correlativ", "fklbdocver", "fklbrutser", "userId", "agendaId", "tipoOT", "createdAt", "updatedAt")
      VALUES (
        ${`ot-${Date.now()}-1`},
        ${`R-12-03-${agenda.id.toString().padStart(6, '0')}-001`},
        'PENDIENTE',
        'VISITA',
        '',
        '001',
        'R-12-03',
        'DEN001',
        ${user.id},
        ${agenda.id},
        'DENSIDADES',
        NOW(),
        NOW()
      )
    `

    // OT para Muestreo de Hormigón usando HORMIGON_FRESCO
    await prisma.$executeRaw`
      INSERT INTO "OrdenTrabajo" ("id", "clave", "estado", "origen", "fklbrutas", "correlativ", "fklbdocver", "fklbrutser", "userId", "agendaId", "tipoOT", "createdAt", "updatedAt")
      VALUES (
        ${`ot-${Date.now()}-2`},
        ${`R-12-39-${agenda.id.toString().padStart(6, '0')}-001`},
        'PENDIENTE',
        'VISITA',
        '',
        '001',
        'R-12-39',
        'HOR001',
        ${user.id},
        ${agenda.id},
        'HORMIGON_FRESCO',
        NOW(),
        NOW()
      )
    `

    // OT para Retiro de Probeta
    await prisma.$executeRaw`
      INSERT INTO "OrdenTrabajo" ("id", "clave", "estado", "origen", "fklbrutas", "correlativ", "fklbdocver", "fklbrutser", "userId", "agendaId", "tipoOT", "createdAt", "updatedAt")
      VALUES (
        ${`ot-${Date.now()}-3`},
        ${`R-12-99-${agenda.id.toString().padStart(6, '0')}-001`},
        'PENDIENTE',
        'VISITA',
        '',
        '001',
        'R-12-99',
        'HOR002',
        ${user.id},
        ${agenda.id},
        'RETIRO_PROBETA',
        NOW(),
        NOW()
      )
    `

    console.log('OTs creadas via raw SQL')
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
