/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { Obra } from '@/types/forms/obra'

export const getUserData = async () => {
  try {
    const obras = await prisma.obra.findMany({
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        cotizaciones: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    })

    return obras
  } catch (error) {
    console.error('Error al obtener datos:', error)
    throw error
  }
}

// Función específica para obtener clientes si la necesitas
export const getClientData = async () => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        ClienteContacto: {
          include: {
            Contacto: true
          }
        },
        CondicionComercial: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })

    return clientes
  } catch (error) {
    console.error('Error fetching clients:', error)

    return []
  }
}
