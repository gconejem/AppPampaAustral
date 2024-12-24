const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prismaClient = new PrismaClient()

async function main() {
  // Crear usuario admin
  const hashedPassword = await hash('admin', 10) // Esto debería generar un hash válido

  const adminUser = await prismaClient.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@materio.com',
      emailVerified: new Date(),
      password: hashedPassword // Agregamos la contraseña hasheada
    }
  })

  // Crear sesión para el usuario
  await prismaClient.session.create({
    data: {
      userId: adminUser.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      sessionToken: 'session_token_example'
    }
  })

  // Crear cuenta (para auth)
  await prismaClient.account.create({
    data: {
      userId: adminUser.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: adminUser.id
    }
  })

  // Crear obra de prueba
  const testObra = await prismaClient.obra.create({
    data: {
      numeroObra: 'OB001',
      fechaIngreso: new Date(),
      estado: 'activo',
      estadoObra: 'activo',
      nombreObra: 'Obra de Prueba',
      direccion: 'Dirección de prueba',
      region: 'Metropolitana',
      comuna: 'Santiago',
      razonSocial: 'Empresa de Prueba',
      rut: '12345678-9',
      giro: 'Construcción',
      direccionComercial: 'Dirección comercial',
      comunaFacturacion: 'Santiago',
      telefonoFacturacion: '123456789',
      listaPrecios: 'Lista 1',
      mailRecepcionFactura: 'test@example.com',
      contactos: {
        create: [
          {
            nombre: 'Contacto Prueba',
            cargo: 'Gerente',
            email: 'contacto@test.com',
            telefono1: '987654321'
          }
        ]
      }
    }
  })

  // Crear cliente de prueba
  const testCliente = await prismaClient.cliente.create({
    data: {
      rut: '12345678-9',
      estado: 'active',
      razonSocial: 'Empresa de Prueba',
      nombreCliente: 'Cliente Prueba',
      pais: 'Chile',
      region: 'Metropolitana',
      ciudad: 'Santiago',
      comuna: 'Las Condes',
      direccion: 'Dirección de prueba',
      telefono: '123456789',
      sitioWeb: 'www.test.com',
      segmento: 'Corporativo',
      industria: 'Tecnología',
      clientesContactos: {
        create: [
          {
            contacto: {
              create: {
                nombre: 'Contacto Prueba',
                cargo: 'Gerente',
                email: 'contacto@test.com',
                telefono1: '987654321'
              }
            },
            isPrincipal: true
          }
        ]
      },
      condicionesComerciales: {
        create: {
          vendedor: 'Vendedor 1',
          condicionVenta: '30 días',
          observaciones: 'Observación de prueba'
        }
      }
    }
  })

  console.log('Datos iniciales creados')
  console.log('Test obra created:', testObra)
  console.log('Cliente de prueba creado:', testCliente)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  })
