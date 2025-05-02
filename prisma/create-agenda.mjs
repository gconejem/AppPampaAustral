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
    // Crear primera agenda
    const agenda1 = await prisma.agenda.create({
      data: {
        titulo: "Visita de Control de Calidad",
        tipoVisita: "CONTROL_CALIDAD",
        esRecurrente: false,
        fechaInicio: new Date("2024-05-03T09:00:00Z"),
        fechaFin: new Date("2024-05-03T17:00:00Z"),
        estado: "AGENDADA",
        observaciones: "Visita programada para control de calidad en obra",
        comuna: "Santiago",
        direccion: "Av. Providencia 1234",
        referencia: "Frente al Metro Los Leones",
        region: "Metropolitana",
        sectorComercial: "Construcción",
        horaLlegada: "09:00",
        horaSalida: "17:00",
        kmAdicionales: "0",
        movilizacion: "Vehiculo propio"
      }
    })
    console.log('Agenda 1 creada:', agenda1)

    // Crear segunda agenda
    const agenda2 = await prisma.agenda.create({
      data: {
        titulo: "Muestreo de Hormigón",
        tipoVisita: "MUESTREO",
        esRecurrente: false,
        fechaInicio: new Date("2024-05-04T10:00:00Z"),
        fechaFin: new Date("2024-05-04T14:00:00Z"),
        estado: "AGENDADA",
        observaciones: "Muestreo de hormigón para ensayos de resistencia",
        comuna: "Las Condes",
        direccion: "Av. Apoquindo 4567",
        referencia: "Edificio Corporativo",
        region: "Metropolitana",
        sectorComercial: "Construcción",
        horaLlegada: "10:00",
        horaSalida: "14:00",
        kmAdicionales: "0",
        movilizacion: "Vehiculo propio"
      }
    })
    console.log('Agenda 2 creada:', agenda2)

  } catch (error) {
    console.error('Error al crear agendas:', error)
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
