import type { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Crear un cliente
export const createCliente = async (data: any) => {
  try {
    console.log('Datos recibidos en createCliente:', JSON.stringify(data, null, 2))

    // Validar datos requeridos
    if (!data.rut || !data.razonSocial || !data.nombreCliente || !data.pais) {
      throw new Error('Faltan campos requeridos (RUT, Razón Social, Nombre Cliente o País)')
    }

    // Verificar si ya existe un cliente con ese RUT
    const clienteExistente = await prisma.cliente.findUnique({
      where: { rut: data.rut }
    })

    if (clienteExistente) {
      throw new Error(`Ya existe un cliente con el RUT ${data.rut}`)
    }

    // Separar los datos del cliente de los datos adicionales
    const { vendedor, condicionVenta, clientesContactos, condicionesComerciales, ...datosCliente } = data

    // Crear el cliente primero
    const cliente = await prisma.cliente.create({
      data: {
        ...datosCliente,
        pais: datosCliente.pais || 'Chile',
        fechaCreacion: new Date(),
        giro: datosCliente.giro || '', // Asegurarnos de que sea string vacío en lugar de null
        emailFacturacion: datosCliente.emailFacturacion || '' // Asegurarnos de que sea string vacío en lugar de null
      }
    })

    console.log('Cliente creado con datos básicos:', cliente)

    // Crear los contactos y sus relaciones
    if (clientesContactos?.create) {
      for (const contactoData of clientesContactos.create) {
        let contactoExistente = null

        // Buscar por email o teléfono
        if (contactoData.contacto.create.email) {
          contactoExistente = await prisma.contacto.findFirst({
            where: { email: contactoData.contacto.create.email }
          })
        }

        if (!contactoExistente && contactoData.contacto.create.telefono1) {
          contactoExistente = await prisma.contacto.findFirst({
            where: { telefono1: contactoData.contacto.create.telefono1 }
          })
        }

        let contactoId = null

        if (contactoExistente) {
          contactoId = contactoExistente.contactId
        } else {
          const nuevoContacto = await prisma.contacto.create({
            data: contactoData.contacto.create
          })

          contactoId = nuevoContacto.contactId
        }

        await prisma.clienteContacto.create({
          data: {
            isPrincipal: contactoData.isPrincipal,
            cargo: contactoData.cargo || '',
            cliente: {
              connect: { clienteId: cliente.clienteId }
            },
            contacto: {
              connect: { contactId: contactoId }
            }
          }
        })
      }
    }

    // Crear la condición comercial
    if (condicionesComerciales?.create) {
      await prisma.condicionComercial.create({
        data: {
          ...condicionesComerciales.create,
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

    console.log('Cliente completo creado:', clienteCompleto)

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
    where: { clienteId: id },
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
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
