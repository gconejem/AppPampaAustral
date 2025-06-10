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
    // Eliminar todos los userRol y usuarios existentes
    await prisma.userRol.deleteMany()
    await prisma.user.deleteMany()
    console.log('Usuarios anteriores eliminados')

    // Definir los usuarios y sus roles
    const usuarios = [
      { usuario: "agomez", name: "Alexis Gomez", rut: "14.072.052-6", rol: "Laboratorista" },
      { usuario: "alagos", name: "Alexis Lagos", rut: "17.749.020-2", rol: "Laboratorista" },
      { usuario: "csalinas", name: "Cristian Salinas", rut: "17.696.511-8", rol: "Laboratorista" },
      { usuario: "ftroncoso", name: "Fabián Troncoso", rut: "18.186.559-8", rol: "Laboratorista" },
      { usuario: "flagos", name: "Felipe Lagos", rut: "12.546.542-0", rol: "Laboratorista" },
      { usuario: "fopazo", name: "Felix Opazo", rut: "10.863.686-6", rol: "Laboratorista" },
      { usuario: "jsepulveda", name: "Jonathan Sepúlveda", rut: "17.196.843-7", rol: "Laboratorista" },
      { usuario: "jgualas", name: "Jorge Gualas", rut: "8.849.590-K", rol: "Laboratorista" },
      { usuario: "jcsepulveda", name: "Juan C. Sepúlveda", rut: "17.696.769-2", rol: "Laboratorista" },
      { usuario: "jtroncoso", name: "Juan Troncoso", rut: "8.812.393-9", rol: "Laboratorista" },
      { usuario: "magalyl", name: "Magaly Lillo", rut: "10.824.874-2", rol: "E. de Ruta" },
      { usuario: "mperez", name: "Marcela Perez", rut: "17.755.838-9", rol: "Administrador" },
      { usuario: "msepulveda", name: "Marvin Sepulveda", rut: "14.025.121-6", rol: "Laboratorista" },
      { usuario: "ochandia", name: "Olga Chandia", rut: "15.699.637-8", rol: "E. Comercial" },
      { usuario: "pmena", name: "Paola Mena", rut: "15.878.320-7", rol: "No definido" },
      { usuario: "rvargas", name: "Roberto Vargas", rut: "12.376.550-8", rol: "Laboratorista" },
      { usuario: "vmartinez", name: "Victor Martinez", rut: "12.551.595-9", rol: "No definido" },
      { usuario: "jfigueroa", name: "Jonathan Figueroa", rut: "15.217.721-6", rol: "No definido" },
    ]

    // Obtener todos los roles existentes
    const roles = await prisma.rol.findMany()
    const rolesMap = Object.fromEntries(roles.map(r => [r.nombre, r.id]))

    // Crear usuarios y asignar roles
    for (const usuario of usuarios) {
      const user = await prisma.user.create({
        data: {
          usuario: usuario.usuario,
          name: usuario.name,
          rut: usuario.rut,
          email: `${usuario.usuario}@pampaustral.cl`,
          password: "",
          emailVerified: new Date(),
          image: null
        }
      })
      const rolId = rolesMap[usuario.rol]
      if (!rolId) throw new Error(`No existe el rol: ${usuario.rol}`)
      await prisma.userRol.create({
        data: {
          userId: user.id,
          rolId: rolId
        }
      })
      console.log(`Usuario ${usuario.name} creado y rol ${usuario.rol} asignado`)
    }

  } catch (error) {
    console.error('Error al crear usuarios o asignar roles:', error)
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
