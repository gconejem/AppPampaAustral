import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Crear un cliente
export const createCliente = async (data: Prisma.ClienteCreateInput) => {
  return prisma.cliente.create({
    data,
    include: {
      contactos: true,
      condicionesComerciales: true
    }
  })
}

// Obtener todos los clientes
export const getClientes = async () => {
  return prisma.cliente.findMany({
    include: {
      contactos: true,
      condicionesComerciales: true
    }
  })
}

// Obtener un cliente por ID
export const getClienteById = async (id: number) => {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      contactos: true,
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
      contactos: true,
      condicionesComerciales: true
    }
  })
}

// Eliminar un cliente
export const deleteCliente = async (id: number) => {
  return prisma.cliente.delete({
    where: { id }
  })
} 
