import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Crear un cliente
export const createCliente = async (data: Prisma.ClienteCreateInput) => {
  try {
    console.log('Datos recibidos:', JSON.stringify(data, null, 2))

    // Validar datos requeridos
    if (!data.rut || !data.razonSocial || !data.nombreCliente) {
      throw new Error('Faltan campos requeridos')
    }

    // Verificar si ya existe un cliente con ese RUT
    const clienteExistente = await prisma.cliente.findUnique({
      where: { rut: data.rut }
    })

    if (clienteExistente) {
      throw new Error(`Ya existe un cliente con el RUT ${data.rut}`)
    }

    // Preparar los datos del cliente
    const clienteData = {
      rut: data.rut,
      estado: data.estado || 'active',
      razonSocial: data.razonSocial,
      nombreCliente: data.nombreCliente,
      pais: data.pais,
      region: String(data.region),
      comuna: String(data.comuna),
      ciudad: data.ciudad || 'Santiago',
      direccion: data.direccion,
      telefono: data.telefono,
      sitioWeb: data.sitioWeb || '',
      segmento: data.segmento,
      industria: data.industria,
      fechaCreacion: data.fechaCreacion || new Date(),

      // Manejar contactos de forma segura
      clientesContactos:
        data.clientesContactos && data.clientesContactos.create
          ? {
              create: data.clientesContactos.create.map(contacto => ({
                isPrincipal: contacto.isPrincipal,
                contacto: {
                  create: {
                    nombre: contacto.contacto.create.nombre,
                    cargo: contacto.contacto.create.cargo,
                    email: contacto.contacto.create.email,
                    telefono1: contacto.contacto.create.telefono1,
                    telefono2: contacto.contacto.create.telefono2 || ''
                  }
                }
              }))
            }
          : undefined,

      // Manejar condiciones comerciales de forma segura
      condicionesComerciales: data.condicionesComerciales?.create
        ? {
            create: {
              vendedor: data.condicionesComerciales.create.vendedor,
              condicionVenta: data.condicionesComerciales.create.condicionVenta,
              observaciones: data.condicionesComerciales.create.observaciones || ''
            }
          }
        : undefined
    }

    console.log('Datos preparados:', JSON.stringify(clienteData, null, 2))

    // Crear el cliente con sus relaciones
    const nuevoCliente = await prisma.cliente.create({
      data: clienteData,
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    console.log('Cliente creado:', JSON.stringify(nuevoCliente, null, 2))

    return nuevoCliente
  } catch (error) {
    console.error('Error detallado al crear cliente:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        throw new Error(`Ya existe un cliente con el RUT ${data.rut}`)
      }
    }

    throw error
  }
}

// Obtener todos los clientes
export const getClientes = async () => {
  return prisma.cliente.findMany({
    include: {
      clientesContactos: {
        include: {
          contacto: true
        }
      },
      condicionesComerciales: true
    }
  })
}

// Obtener un cliente por ID
export const getClienteById = async (id: number) => {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      clientesContactos: {
        include: {
          contacto: true
        }
      },
      condicionesComerciales: true
    }
  })
}

// Actualizar un cliente
export const updateCliente = async (id: number, data: Prisma.ClienteUpdateInput) => {
  return prisma.cliente.update({
    where: { id },
    data,
    include: {
      clientesContactos: {
        include: {
          contacto: true
        }
      },
      condicionesComerciales: true
    }
  })
}

// Eliminar un cliente
export const deleteCliente = async (id: number) => {
  // Iniciamos una transacción para asegurar que todo se ejecute o nada
  return prisma.$transaction(async (tx: typeof prisma) => {
    try {
      // 1. Eliminamos los contactos asociados
      await tx.clienteContacto.deleteMany({
        where: { clienteId: id }
      })

      // 2. Eliminamos las condiciones comerciales
      await tx.condicionComercial.deleteMany({
        where: { clienteId: id }
      })

      // 3. Finalmente eliminamos el cliente usando clienteId
      return tx.cliente.delete({
        where: { clienteId: id }
      })
    } catch (error) {
      console.error('Error en la transacción de eliminación:', error)
      throw error
    }
  })
}
