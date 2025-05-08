import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Configurar dotenv para cargar el archivo .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  try {
    // Crear primer usuario
    const user1 = await prisma.user.create({
      data: {
        name: "María González",
        email: "maria.gonzalez@pampaustral.cl",
        password: "maria2024",
        emailVerified: new Date(),
        image: null
      }
    })
    console.log('Usuario 1 creado:', user1)

    // Crear segundo usuario
    const user2 = await prisma.user.create({
      data: {
        name: "Juan Pérez",
        email: "juan.perez@pampaustral.cl",
        password: "juan2024",
        emailVerified: new Date(),
        image: null
      }
    })
    console.log('Usuario 2 creado:', user2)

  } catch (error) {
    console.error('Error al crear usuarios:', error)
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
