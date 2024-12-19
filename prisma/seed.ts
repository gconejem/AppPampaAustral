const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')
const prismaClient = new PrismaClient()

async function main() {
  // Crear usuario admin
  const hashedPassword = await hash('admin', 10)  // Esto debería generar un hash válido
  
  const adminUser = await prismaClient.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@materio.com',
      emailVerified: new Date(),
      password: hashedPassword  // Agregamos la contraseña hasheada
    },
  })

  // Crear sesión para el usuario
  await prismaClient.session.create({
    data: {
      userId: adminUser.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      sessionToken: 'session_token_example',
    },
  })

  // Crear cuenta (para auth)
  await prismaClient.account.create({
    data: {
      userId: adminUser.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: adminUser.id,
    },
  })

  console.log('Datos iniciales creados')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  })
