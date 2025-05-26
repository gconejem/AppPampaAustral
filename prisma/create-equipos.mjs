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
    // Primero eliminar todos los equipos existentes
    await prisma.agendaEquipo.deleteMany()
    await prisma.equipo.deleteMany()
    console.log('Equipos existentes eliminados')

    // Crear equipos de ejemplo
    const equipos = [
      {
        codigo: "EQ001",
        nombre: "Cono de Abrams",
        descripcion: "Equipo para medir la consistencia del hormigón fresco",
        estado: true
      },
      {
        codigo: "EQ002",
        nombre: "Prensa Universal",
        descripcion: "Equipo para ensayos de resistencia a la compresión",
        estado: true
      },
      {
        codigo: "EQ003",
        nombre: "Densímetro Nuclear",
        descripcion: "Equipo para medir la densidad del suelo",
        estado: true
      },
      {
        codigo: "EQ004",
        nombre: "Extractor de Núcleos",
        descripcion: "Equipo para extraer testigos de hormigón",
        estado: true
      },
      {
        codigo: "EQ005",
        nombre: "Tamices",
        descripcion: "Juego de tamices para análisis granulométrico",
        estado: true
      },
      {
        codigo: "EQ006",
        nombre: "Termómetro Digital",
        descripcion: "Medición de temperatura en hormigón y ambiente",
        estado: true
      },
      {
        codigo: "EQ007",
        nombre: "Horno de Secado",
        descripcion: "Equipo para secado de muestras",
        estado: true
      },
      {
        codigo: "EQ008",
        nombre: "Balanza de Precisión",
        descripcion: "Equipo para pesaje de muestras",
        estado: true
      }
    ]

    // Crear los equipos en la base de datos
    for (const equipo of equipos) {
      const equipoCreado = await prisma.equipo.create({
        data: equipo
      })
      console.log('Equipo creado:', equipoCreado)
    }

  } catch (error) {
    console.error('Error al crear equipos:', error)
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
