import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear roles básicos
  const roles = [
    {
      nombre: 'ADMIN',
      descripcion: 'Administrador del sistema'
    },
    {
      nombre: 'LABORATORISTA',
      descripcion: 'Laboratorista que realiza las visitas'
    },
    {
      nombre: 'SUPERVISOR',
      descripcion: 'Supervisor de laboratoristas'
    }
  ]

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol
    })
  }

  console.log('Roles base creados')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
