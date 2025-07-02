/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { Obra } from '@/types/forms/obra'
import type { InvoiceType } from '@/types/apps/invoiceTypes'

export const getUserData = async (): Promise<Obra[]> => {
  try {
    const obras = await prisma.obra.findMany({
      include: {
        contactos: true,
        cotizaciones: true,
        solicitudes: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    })

    return obras as Obra[]
  } catch (error) {
    console.error('Error fetching obras:', error)

    return []
  }
}

// Función específica para obtener clientes si la necesitas
export const getClientData = async () => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
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

// Función para obtener datos de facturas
export const getInvoiceData = async (): Promise<InvoiceType[]> => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true,
            comuna: true
          }
        },
        contacto: true
      }
    })

    return cotizaciones.map(cotizacion => {
      const nombreContacto = cotizacion.contacto?.nombre || 'Sin contacto'

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        empresa: cotizacion.empresa || 'No especificada',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion || 'No especificada',
        tipo: cotizacion.tipoCotizacion,
        contacto: nombreContacto,
        estado: cotizacion.estado,
        cargo: cotizacion.contacto?.cargo || '',
        email: cotizacion.contacto?.email || '',
        telefono: cotizacion.contacto?.telefono1 || '',
        total: parseFloat(cotizacion.total.toString()),
        observacionGestion: cotizacion.observacionGestion || ''
      } as InvoiceType
    })
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)

    return []
  }
}
