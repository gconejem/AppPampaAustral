import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Crear un contacto
export const createContacto = async (data: Prisma.ContactoCreateInput) => {
  return prisma.contacto.create({
    data
  })
}

// Obtener todos los contactos
export const getContactos = async () => {
  return prisma.contacto.findMany({
    include: {
      clientesContactos: {
        include: {
          cliente: true
        }
      }
    }
  })
}

// Obtener un contacto por ID
export const getContactoById = async (id: number) => {
  return prisma.contacto.findUnique({
    where: { contactId: id },
    include: {
      ClienteContacto: {
        include: {
          Cliente: true
        }
      }
    }
  })
}

// Actualizar un contacto
export const updateContacto = async (id: number, data: Prisma.ContactoUpdateInput) => {
  return prisma.contacto.update({
    where: { id },
    data,
    include: {
      clientesContactos: {
        include: {
          cliente: true
        }
      }
    }
  })
}

// Eliminar un contacto
export const deleteContacto = async (id: number) => {
  return prisma.contacto.delete({
    where: { id }
  })
}
