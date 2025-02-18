import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Crear un cliente
export const createCliente = async (data: any) => {
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

    // Crear el cliente primero
    const cliente = await prisma.cliente.create({
      data: {
        rut: data.rut,
        estado: data.estado,
        razonSocial: data.razonSocial,
        nombreCliente: data.nombreCliente,
        pais: data.pais,
        region: data.region,
        ciudad: data.ciudad,
        comuna: data.comuna,
        direccion: data.direccion,
        telefono: data.telefono,
        sitioWeb: data.sitioWeb,
        segmento: data.segmento,
        industria: data.industria,
        fechaCreacion: new Date()
      }
    })

    // Crear los contactos y sus relaciones
    if (data.clientesContactos?.create) {
      for (const contactoData of data.clientesContactos.create) {
        const contacto = await prisma.contacto.create({
          data: contactoData.contacto.create
        })

        await prisma.clienteContacto.create({
          data: {
            isPrincipal: contactoData.isPrincipal,
            cliente: {
              connect: { clienteId: cliente.clienteId }
            },
            contacto: {
              connect: { contactId: contacto.contactId }
            }
          }
        })
      }
    }

    // Crear la condición comercial
    if (data.condicionesComerciales?.create) {
      await prisma.condicionComercial.create({
        data: {
          ...data.condicionesComerciales.create,
          cliente: {
            connect: { clienteId: cliente.clienteId }
          }
        }
      })
    }

    // Obtener el cliente con todas sus relaciones
    const clienteCompleto = await prisma.cliente.findUnique({
      where: {
        clienteId: cliente.clienteId
      },
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    return clienteCompleto
  } catch (error) {
    console.error('Error al crear cliente:', error)
    throw error
  }
}

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    return prisma.cliente.findMany({
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true,
        cotizaciones: true,
        solicitudes: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    throw error
  }
}

// Obtener un cliente por ID
export const getClienteById = async (id: number) => {
  return prisma.cliente.findUnique({
    where: { clienteId: id },
    include: {
      clientesContactos: {
        include: {
          contacto: true
        }
      },
      condicionesComerciales: true,
      cotizaciones: true,
      solicitudes: true
    }
  })
}

// Actualizar un cliente
export const updateCliente = async (id: number, data: Prisma.ClienteUpdateInput) => {
  return prisma.cliente.update({
    where: { id },
    data,
    include: {
      ClienteContacto: {
        include: {
          contacto: true
        }
      },
      CondicionComercial: true
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
