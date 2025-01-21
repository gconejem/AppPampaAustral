import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const listasPrecios = [
  { nombre: 'Lista 1', precio: 1000 },
  { nombre: 'Lista 2', precio: 2000 },
  { nombre: 'Lista 3', precio: 3000 }
]

const regiones = [
  {
    codigo: '15',
    nombre: 'Arica y Parinacota',
    comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos']
  },
  {
    codigo: '01',
    nombre: 'Tarapacá',
    comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica']
  },
  {
    codigo: '02',
    nombre: 'Antofagasta',
    comunas: [
      'Antofagasta',
      'Mejillones',
      'Sierra Gorda',
      'Taltal',
      'Calama',
      'Ollagüe',
      'San Pedro de Atacama',
      'Tocopilla',
      'María Elena'
    ]
  },
  {
    codigo: '03',
    nombre: 'Atacama',
    comunas: [
      'Copiapó',
      'Caldera',
      'Tierra Amarilla',
      'Chañaral',
      'Diego de Almagro',
      'Vallenar',
      'Alto del Carmen',
      'Freirina',
      'Huasco'
    ]
  },
  {
    codigo: '04',
    nombre: 'Coquimbo',
    comunas: [
      'La Serena',
      'Coquimbo',
      'Andacollo',
      'La Higuera',
      'Paiguano',
      'Vicuña',
      'Illapel',
      'Canela',
      'Los Vilos',
      'Salamanca',
      'Ovalle',
      'Combarbalá',
      'Monte Patria',
      'Punitaqui',
      'Río Hurtado'
    ]
  },
  {
    codigo: '05',
    nombre: 'Valparaíso',
    comunas: [
      'Valparaíso',
      'Casablanca',
      'Concón',
      'Juan Fernández',
      'Puchuncaví',
      'Quintero',
      'Viña del Mar',
      'Isla de Pascua',
      'Los Andes',
      'Calle Larga',
      'Rinconada',
      'San Esteban',
      'La Ligua',
      'Cabildo',
      'Papudo',
      'Petorca',
      'Zapallar',
      'Quillota',
      'Calera',
      'Hijuelas',
      'La Cruz',
      'Nogales',
      'San Antonio',
      'Algarrobo',
      'Cartagena',
      'El Quisco',
      'El Tabo',
      'Santo Domingo',
      'San Felipe',
      'Catemu',
      'Llaillay',
      'Panquehue',
      'Putaendo',
      'Santa María',
      'Quilpué',
      'Limache',
      'Olmué',
      'Villa Alemana'
    ]
  },
  {
    codigo: '06',
    nombre: "O'Higgins",
    comunas: [
      'Rancagua',
      'Codegua',
      'Coinco',
      'Coltauco',
      'Doñihue',
      'Graneros',
      'Las Cabras',
      'Machalí',
      'Malloa',
      'Mostazal',
      'Olivar',
      'Peumo',
      'Pichidegua',
      'Quinta de Tilcoco',
      'Rengo',
      'Requínoa',
      'San Vicente',
      'Pichilemu',
      'La Estrella',
      'Litueche',
      'Marchihue',
      'Navidad',
      'Paredones',
      'San Fernando',
      'Chépica',
      'Chimbarongo',
      'Lolol',
      'Nancagua',
      'Palmilla',
      'Peralillo',
      'Placilla',
      'Pumanque',
      'Santa Cruz'
    ]
  },
  {
    codigo: '07',
    nombre: 'Maule',
    comunas: [
      'Talca',
      'Constitución',
      'Curepto',
      'Empedrado',
      'Maule',
      'Pelarco',
      'Pencahue',
      'Río Claro',
      'San Clemente',
      'San Rafael',
      'Cauquenes',
      'Chanco',
      'Pelluhue',
      'Curicó',
      'Hualañé',
      'Licantén',
      'Molina',
      'Rauco',
      'Romeral',
      'Sagrada Familia',
      'Teno',
      'Vichuquén',
      'Linares',
      'Colbún',
      'Longaví',
      'Parral',
      'Retiro',
      'San Javier',
      'Villa Alegre',
      'Yerbas Buenas'
    ]
  },
  {
    codigo: '08',
    nombre: 'Biobío',
    comunas: [
      'Concepción',
      'Coronel',
      'Chiguayante',
      'Florida',
      'Hualqui',
      'Lota',
      'Penco',
      'San Pedro de la Paz',
      'Santa Juana',
      'Talcahuano',
      'Tomé',
      'Hualpén',
      'Lebu',
      'Arauco',
      'Cañete',
      'Contulmo',
      'Curanilahue',
      'Los Álamos',
      'Tirúa',
      'Los Ángeles',
      'Antuco',
      'Cabrero',
      'Laja',
      'Mulchén',
      'Nacimiento',
      'Negrete',
      'Quilaco',
      'Quilleco',
      'San Rosendo',
      'Santa Bárbara',
      'Tucapel',
      'Yumbel',
      'Alto Biobío'
    ]
  },
  {
    codigo: '09',
    nombre: 'La Araucanía',
    comunas: [
      'Temuco',
      'Carahue',
      'Cunco',
      'Curarrehue',
      'Freire',
      'Galvarino',
      'Gorbea',
      'Lautaro',
      'Loncoche',
      'Melipeuco',
      'Nueva Imperial',
      'Padre las Casas',
      'Perquenco',
      'Pitrufquén',
      'Pucón',
      'Saavedra',
      'Teodoro Schmidt',
      'Toltén',
      'Vilcún',
      'Villarrica',
      'Cholchol',
      'Angol',
      'Collipulli',
      'Curacautín',
      'Ercilla',
      'Lonquimay',
      'Los Sauces',
      'Lumaco',
      'Purén',
      'Renaico',
      'Traiguén',
      'Victoria'
    ]
  },
  {
    codigo: '14',
    nombre: 'Los Ríos',
    comunas: [
      'Valdivia',
      'Corral',
      'Lanco',
      'Los Lagos',
      'Máfil',
      'Mariquina',
      'Paillaco',
      'Panguipulli',
      'La Unión',
      'Futrono',
      'Lago Ranco',
      'Río Bueno'
    ]
  },
  {
    codigo: '10',
    nombre: 'Los Lagos',
    comunas: [
      'Puerto Montt',
      'Calbuco',
      'Cochamó',
      'Fresia',
      'Frutillar',
      'Los Muermos',
      'Llanquihue',
      'Maullín',
      'Puerto Varas',
      'Castro',
      'Ancud',
      'Chonchi',
      'Curaco de Vélez',
      'Dalcahue',
      'Puqueldón',
      'Queilén',
      'Quellón',
      'Quemchi',
      'Quinchao',
      'Osorno',
      'Puerto Octay',
      'Purranque',
      'Puyehue',
      'Río Negro',
      'San Juan de la Costa',
      'San Pablo',
      'Chaitén',
      'Futaleufú',
      'Hualaihué',
      'Palena'
    ]
  },
  {
    codigo: '11',
    nombre: 'Aysén',
    comunas: [
      'Coihaique',
      'Lago Verde',
      'Aysén',
      'Cisnes',
      'Guaitecas',
      'Cochrane',
      "O'Higgins",
      'Tortel',
      'Chile Chico',
      'Río Ibáñez'
    ]
  },
  {
    codigo: '12',
    nombre: 'Magallanes',
    comunas: [
      'Punta Arenas',
      'Laguna Blanca',
      'Río Verde',
      'San Gregorio',
      'Cabo de Hornos',
      'Antártica',
      'Porvenir',
      'Primavera',
      'Timaukel',
      'Natales',
      'Torres del Paine'
    ]
  },
  {
    codigo: '13',
    nombre: 'Metropolitana',
    comunas: [
      'Cerrillos',
      'Cerro Navia',
      'Conchalí',
      'El Bosque',
      'Estación Central',
      'Huechuraba',
      'Independencia',
      'La Cisterna',
      'La Florida',
      'La Granja',
      'La Pintana',
      'La Reina',
      'Las Condes',
      'Lo Barnechea',
      'Lo Espejo',
      'Lo Prado',
      'Macul',
      'Maipú',
      'Ñuñoa',
      'Pedro Aguirre Cerda',
      'Peñalolén',
      'Providencia',
      'Pudahuel',
      'Quilicura',
      'Quinta Normal',
      'Recoleta',
      'Renca',
      'San Joaquín',
      'San Miguel',
      'San Ramón',
      'Santiago',
      'Vitacura',
      'Puente Alto',
      'Pirque',
      'San José de Maipo',
      'Colina',
      'Lampa',
      'Tiltil',
      'San Bernardo',
      'Buin',
      'Calera de Tango',
      'Paine',
      'Melipilla',
      'Alhué',
      'Curacaví',
      'María Pinto',
      'San Pedro',
      'Talagante',
      'El Monte',
      'Isla de Maipo',
      'Padre Hurtado',
      'Peñaflor'
    ]
  }
]

async function seedListasPrecios() {
  for (const lista of listasPrecios) {
    try {
      await prisma.listaPrecio.upsert({
        where: {
          nombre: lista.nombre
        },
        update: {
          precio: lista.precio
        },
        create: {
          nombre: lista.nombre,
          precio: lista.precio
        }
      })
      console.log(`Lista de precios "${lista.nombre}" creada/actualizada con éxito`)
    } catch (error) {
      console.error(`Error al crear/actualizar lista de precios "${lista.nombre}":`, error)
    }
  }
}

async function seedRegionesYComunas() {
  console.log('Iniciando la creación de regiones y comunas...')

  for (const region of regiones) {
    try {
      const regionCreada = await prisma.region.upsert({
        where: { codigo: region.codigo },
        update: { nombre: region.nombre },
        create: {
          codigo: region.codigo,
          nombre: region.nombre
        }
      })

      for (const nombreComuna of region.comunas) {
        await prisma.comuna.upsert({
          where: {
            codigo: `${region.codigo}-${nombreComuna.toLowerCase().replace(/\s+/g, '-')}`
          },
          update: {
            nombre: nombreComuna,
            regionId: regionCreada.id
          },
          create: {
            codigo: `${region.codigo}-${nombreComuna.toLowerCase().replace(/\s+/g, '-')}`,
            nombre: nombreComuna,
            regionId: regionCreada.id
          }
        })
      }

      console.log(`Región ${region.nombre} y sus comunas creadas/actualizadas con éxito`)
    } catch (error) {
      console.error(`Error al crear región ${region.nombre}:`, error)
    }
  }
}

async function main() {
  console.log('Iniciando seed...')

  // Verificar si el usuario admin ya existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@materio.com' }
  })

  let adminUser = existingAdmin

  if (!existingAdmin) {
    // Crear usuario admin solo si no existe
    const hashedPassword = await hash('admin', 10)

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@materio.com',
        emailVerified: new Date(),
        password: hashedPassword
      }
    })

    // Crear sesión para el usuario
    await prisma.session.create({
      data: {
        userId: adminUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sessionToken: 'session_token_example'
      }
    })

    // Crear cuenta (para auth)
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: adminUser.id
      }
    })
  }

  // Verificar si la obra de prueba ya existe
  const existingObra = await prisma.obra.findFirst({
    where: { numeroObra: 'OB001' }
  })

  if (!existingObra) {
    // Crear obra de prueba
    const testObra = await prisma.obra.create({
      data: {
        numeroObra: 'OB001',
        fechaIngreso: new Date('2024-12-31T17:05:08.163Z'),
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
        nombreCliente: 'Cliente de Prueba',
        contactos: {
          create: [
            {
              nombre: 'Contacto Prueba',
              rol: 'encargado_obra',
              email: 'contacto@test.com',
              telefono1: '987654321',
              isPrincipal: true
            }
          ]
        }
      }
    })

    console.log('Test obra created:', testObra)
  }

  // Verificar si el cliente de prueba ya existe
  const existingCliente = await prisma.cliente.findUnique({
    where: { rut: '12345678-9' }
  })

  if (!existingCliente) {
    // Crear cliente de prueba
    const testCliente = await prisma.cliente.create({
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

    console.log('Cliente de prueba creado:', testCliente)
  }

  await seedListasPrecios()
  await seedRegionesYComunas()

  console.log('Datos iniciales creados/verificados')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
