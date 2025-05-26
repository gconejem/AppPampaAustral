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
    // Primero eliminar todos los roles existentes
    await prisma.userRol.deleteMany()
    await prisma.rol.deleteMany()
    console.log('Roles existentes eliminados')

    // Crear rol de Administrador
    const rolAdmin = await prisma.rol.create({
      data: {
        nombre: "Administrador",
        descripcion: "Rol con acceso total al sistema"
      }
    })
    console.log('Rol Administrador creado:', rolAdmin)

    // Crear rol de Supervisor
    const rolSupervisor = await prisma.rol.create({
      data: {
        nombre: "Supervisor",
        descripcion: "Rol para supervisar operaciones y gestionar equipos"
      }
    })
    console.log('Rol Supervisor creado:', rolSupervisor)

    // Crear rol de Técnico
    const rolTecnico = await prisma.rol.create({
      data: {
        nombre: "Técnico",
        descripcion: "Rol para realizar trabajos técnicos y reportes"
      }
    })
    console.log('Rol Técnico creado:', rolTecnico)

    // Crear rol de Laboratorista
    const rolLaboratorista = await prisma.rol.create({
      data: {
        nombre: "Laboratorista",
        descripcion: "Rol para realizar ensayos y análisis en laboratorio"
      }
    })
    console.log('Rol Laboratorista creado:', rolLaboratorista)

    // Crear rol de Vendedor
    const rolVendedor = await prisma.rol.create({
      data: {
        nombre: "Vendedor",
        descripcion: "Rol para gestionar clientes y cotizaciones"
      }
    })
    console.log('Rol Vendedor creado:', rolVendedor)

  } catch (error) {
    console.error('Error al crear roles:', error)
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
