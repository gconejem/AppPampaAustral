const { PrismaClient, TipoOrdenTrabajo } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Buscar una agenda existente
    const agenda = await prisma.agenda.findFirst({
      where: {
        tipoVisita: 'VISITA'
      }
    })

    if (!agenda) {
      throw new Error('No se encontró ninguna agenda')
    }

    // Buscar un usuario existente (laboratorista)
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

    // Actualizar las OTs existentes o crear nuevas si no existen
    const ordenesTrabajo = await Promise.all([
      prisma.ordenTrabajo
        .update({
          where: { clave: '2024123059609PC-040010' },
          data: {
            agenda: { connect: { id: agenda.id } }
          }
        })
        .catch(() => {
          // Si la OT no existe, la creamos
          return prisma.ordenTrabajo.create({
            data: {
              clave: '2024123059609PC-040010',
              estado: 'PENDIENTE',
              origen: 'VISITA',
              fklbrutas: '',
              correlativ: '',
              fklbdocver: '',
              fklbrutser: '',
              tipoOT: TipoOrdenTrabajo.ACEPTACION_VISITA,
              user: { connect: { id: user.id } },
              agenda: { connect: { id: agenda.id } }
            }
          })
        }),
      prisma.ordenTrabajo
        .update({
          where: { clave: '2024123058470PC-040010' },
          data: {
            agenda: { connect: { id: agenda.id } }
          }
        })
        .catch(() => {
          // Si la OT no existe, la creamos
          return prisma.ordenTrabajo.create({
            data: {
              clave: '2024123058470PC-040010',
              estado: 'PENDIENTE',
              origen: 'VISITA',
              fklbrutas: '',
              correlativ: '',
              fklbdocver: '',
              fklbrutser: '',
              tipoOT: TipoOrdenTrabajo.DENSIDADES,
              user: { connect: { id: user.id } },
              agenda: { connect: { id: agenda.id } }
            }
          })
        })
    ])

    console.log('OTs actualizadas/creadas:', ordenesTrabajo)
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
