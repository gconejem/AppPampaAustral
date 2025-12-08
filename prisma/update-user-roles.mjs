import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const usuarios = [
  { usuario: "agomez", rol: "Laboratorista" },
  { usuario: "alagos", rol: "Laboratorista" },
  { usuario: "csalinas", rol: "Laboratorista" },
  { usuario: "ftroncoso", rol: "Laboratorista" },
  { usuario: "flagos", rol: "Laboratorista" },
  { usuario: "fopazo", rol: "Laboratorista" },
  { usuario: "jsepulveda", rol: "Laboratorista" },
  { usuario: "jgualas", rol: "Laboratorista" },
  { usuario: "jcsepulveda", rol: "Laboratorista" },
  { usuario: "jtroncoso", rol: "Laboratorista" },
  { usuario: "magalyl", rol: "E. de Ruta" },
  { usuario: "mperez", rol: "Administrador" },
  { usuario: "msepulveda", rol: "Laboratorista" },
  { usuario: "ochandia", rol: "E. Comercial" },
  { usuario: "pmena", rol: "Consulta" },
  { usuario: "rvargas", rol: "Laboratorista" },
  { usuario: "vmartinez", rol: "Consulta" },
  { usuario: "jfigueroa", rol: "Consulta" }
]

const usuariosPermitidos = usuarios.map(u => u.usuario);

async function main() {
  // Crea relaciones
  for (const usuario of usuarios) {
    const user = await prisma.user.findFirst({ where: { usuario: usuario.usuario } })
    const rol = await prisma.rol.findUnique({ where: { nombre: usuario.rol } })

    console.log({user, rol})

    if (!user || !rol) {
      console.log(`Usuario o rol no encontrado: ${usuario.usuario} - ${usuario.rol}`)
      continue
    }
    // Elimina relación anterior si existe
    await prisma.userRol.deleteMany({ where: { userId: user.id } })
    // Crea nueva relación
    await prisma.userRol.create({
      data: {
        userId: user.id,
        rolId: rol.id
      }
    })
    console.log(`Rol actualizado para usuario ${usuario.usuario}: ${usuario.rol}`)
  }

  // Elimina usuarios que no están en el array
  const usuariosTodos = await prisma.user.findMany();
  for (const user of usuariosTodos) {
    if (!usuariosPermitidos.includes(user.usuario)) {
      // Elimina relaciones con roles y agenda antes de borrar el usuario
      await prisma.userRol.deleteMany({ where: { userId: user.id } });
      await prisma.agendaAsignado.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Usuario eliminado: ${user.usuario}`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
