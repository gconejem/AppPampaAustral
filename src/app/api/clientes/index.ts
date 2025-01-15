import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

import prisma from '@/lib/prisma'

// Crear un cliente
export const createCliente = async (data: Prisma.ClienteCreateInput) => {
  try {
    // Asegurarnos de que estamos guardando el nombre de la comuna
    const clienteData = {
      ...data,

      // Si la comuna viene como número, necesitamos convertirla a string
      comuna: typeof data.comuna === 'number' ? String(data.comuna) : data.comuna, // Ya debería ser el nombre de la comuna
      region: typeof data.region === 'number' ? String(data.region) : data.region, // Ya debería ser el nombre de la región
      clientesContactos: {
        create: data.clientesContactos?.create?.map(contacto => ({
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
      },
      condicionesComerciales: {
        create: {
          vendedor: data.condicionesComerciales.create.vendedor,
          condicionVenta: data.condicionesComerciales.create.condicionVenta,
          observaciones: data.condicionesComerciales.create.observaciones
        }
      }
    }

    return prisma.cliente.create({
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
  } catch (error) {
    console.error('Error creating client:', error)
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
    // 1. Eliminamos solo las relaciones en ClienteContacto
    await tx.clienteContacto.deleteMany({
      where: { clienteId: id }
    })

    // 2. Eliminamos las condiciones comerciales
    await tx.condicionComercial.deleteMany({
      where: { clienteId: id }
    })

    // 3. Finalmente eliminamos el cliente
    return tx.cliente.delete({
      where: { id }
    })
  })
}
