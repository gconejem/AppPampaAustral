import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Permisos de solo lectura de cada módulo
  const permisosLectura = [
    'empresa.read',
    'productos.read',
    'cotizaciones.read',
    'solicitudes.read',
    'agenda.read',
    'control.read'
  ]

  // Busca los permisos en la base
  const permisosDb = await prisma.permission.findMany({
    where: { name: { in: permisosLectura } }
  })

  // Crea el rol TESTING si no existe
  let rolTesting = await prisma.rol.findUnique({ where: { nombre: 'TESTING' } })
  if (!rolTesting) {
    rolTesting = await prisma.rol.create({
      data: {
        nombre: 'TESTING',
        descripcion: 'Rol para pruebas con permisos de solo lectura en todos los módulos'
      }
    })
  }

  // Elimina relaciones previas del rol TESTING
  await prisma.rolPermiso.deleteMany({ where: { rolId: rolTesting.id } })

  // Asigna los permisos de solo lectura al rol TESTING
  for (const permiso of permisosDb) {
    await prisma.rolPermiso.create({
      data: {
        rolId: rolTesting.id,
        permissionId: permiso.id
      }
    })
  }

  console.log('Rol TESTING creado y actualizado con permisos de solo lectura.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())