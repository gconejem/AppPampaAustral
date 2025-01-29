/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { Cliente } from '@/types/forms/cliente'

export const getUserData = async (): Promise<Cliente[]> => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        clienteContactos: {
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

    return clientes as Cliente[]
  } catch (error) {
    console.error('Error fetching clients:', error)

    return []
  }
}
