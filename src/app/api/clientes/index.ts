import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

// Crear un cliente
export const createCliente = async (data: Prisma.ClienteCreateInput) => {
  return prisma.cliente.create({
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
