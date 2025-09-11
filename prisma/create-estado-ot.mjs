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
    // Eliminar todos los registros existentes de EstadoOT
    await prisma.estadoOT.deleteMany()
    console.log('Estados OT existentes eliminados')

    // Definir los estados de OT
    const estadosOT = [
      { origen: "APP", tipoJSON: "C", estado: "COMPLETADA" },
      { origen: "APP", tipoJSON: "A", estado: "AGENDADA" },
      { origen: "APP", tipoJSON: "P", estado: "EN_PROCESO" },
      { origen: "APP", tipoJSON: "X", estado: "CANCELADA" },
      { origen: "SISTEMA", tipoJSON: null, estado: "DISPONIBLE" },
      { origen: "SISTEMA", tipoJSON: null, estado: "EN_REVISION" },
      { origen: "SISTEMA", tipoJSON: null, estado: "ANULADA" },
      { origen: "SISTEMA", tipoJSON: null, estado: "CODIFICADA" }
    ]

    // Crear los estados de OT
    for (const estadoOT of estadosOT) {
      const nuevoEstado = await prisma.estadoOT.create({
        data: {
          origen: estadoOT.origen,
          tipoJSON: estadoOT.tipoJSON,
          estado: estadoOT.estado
        }
      })
      console.log(`Estado OT creado: ID ${nuevoEstado.id} - Origen: ${nuevoEstado.origen}, TipoJSON: ${nuevoEstado.tipoJSON || 'null'}, Estado: ${nuevoEstado.estado}`)
    }

    console.log('Todos los estados de OT han sido creados exitosamente')

  } catch (error) {
    console.error('Error al crear estados de OT:', error)
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
