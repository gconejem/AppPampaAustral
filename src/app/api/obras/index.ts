import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'

// Crear una obra
export const createObra = async (data: Prisma.ObraCreateInput) => {
  return prisma.obra.create({
    data,
    include: {
      contactos: true
    }
  })
}

// Obtener todas las obras
export const getObras = async () => {
  return prisma.obra.findMany({
    include: {
      contactos: true
    }
  })
}

// Obtener una obra por ID
export const getObraById = async (id: number) => {
  return prisma.obra.findUnique({
    where: { obraId: id },
    include: {
      contactos: true
    }
  })
}

// Actualizar una obra
export const updateObra = async (id: number, data: Prisma.ObraUpdateInput) => {
  return prisma.obra.update({
    where: { obraId: id },
    data,
    include: {
      contactos: true
    }
  })
}

// Eliminar una obra
export const deleteObra = async (id: number) => {
  return prisma.$transaction(async tx => {
    // 1. Eliminar los contactos asociados
    await tx.contactoObra.deleteMany({
      where: { obraId: id }
    })

    // 2. Eliminar la obra
    return tx.obra.delete({
      where: { obraId: id }
    })
  })
}
