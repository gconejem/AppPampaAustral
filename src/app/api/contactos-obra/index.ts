import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'

// Obtener contactos por búsqueda
export const searchContactos = async (query: string) => {
  return prisma.contactoObra.findMany({
    where: {
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { cargo: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 10,
    orderBy: {
      nombre: 'asc'
    }
  })
}

// Crear contacto
export const createContacto = async (data: Prisma.ContactoObraCreateInput) => {
  return prisma.contactoObra.create({
    data
  })
}

// Actualizar contacto
export const updateContacto = async (id: number, data: Prisma.ContactoObraUpdateInput) => {
  return prisma.contactoObra.update({
    where: { id },
    data
  })
}

// Eliminar contacto
export const deleteContacto = async (id: number) => {
  return prisma.contactoObra.delete({
    where: { id }
  })
}
