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

    // Crear rol de Laboratorista
    const rolLaboratorista = await prisma.rol.create({
      data: {
        nombre: "Laboratorista",
        descripcion: "Rol para realizar ensayos y análisis en laboratorio"
      }
    })
    console.log('Rol Laboratorista creado:', rolLaboratorista)

    // Crear rol de Laboratorista / E. de Área Sala
    const rolLaboratoristaArea = await prisma.rol.create({
      data: {
        nombre: "Laboratorista / E. de Área Sala",
        descripcion: "Rol para gestionar área de sala y realizar ensayos"
      }
    })
    console.log('Rol Laboratorista / E. de Área Sala creado:', rolLaboratoristaArea)

    // Crear rol de E. de Ruta
    const rolRuta = await prisma.rol.create({
      data: {
        nombre: "E. de Ruta",
        descripcion: "Rol para gestionar rutas y entregas"
      }
    })
    console.log('Rol E. de Ruta creado:', rolRuta)

    // Crear rol de E. Comercial
    const rolComercial = await prisma.rol.create({
      data: {
        nombre: "E. Comercial",
        descripcion: "Rol para gestionar aspectos comerciales"
      }
    })
    console.log('Rol E. Comercial creado:', rolComercial)

    // Crear rol No definido
    const rolNoDefinido = await prisma.rol.create({
      data: {
        nombre: "No definido",
        descripcion: "Rol sin definición específica"
      }
    })
    console.log('Rol No definido creado:', rolNoDefinido)

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
