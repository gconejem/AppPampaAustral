import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePackages() {
  try {
    const updated = await prisma.producto.updateMany({
      where: {
        tipo: 'Paquete'
      },
      data: {
        esPaquete: true
      }
    })

    console.log('Paquetes actualizados:', updated)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePackages()
