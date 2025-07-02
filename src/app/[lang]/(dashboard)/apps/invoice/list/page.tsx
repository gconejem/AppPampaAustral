import { Suspense } from 'react'

// Component Imports
import InvoiceList from '@views/apps/invoice/list'

// API Imports
import { prisma } from '@/lib/prisma'
import type { InvoiceType } from '@/types/apps/invoiceTypes'

async function getCotizaciones() {
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

    // Log para diagnóstico
    console.log(
      'Ejemplo de datos de contacto:',
      cotizaciones.length > 0
        ? JSON.stringify(
          {
            contactId: cotizaciones[0].contactId,
            contactoRelacion: cotizaciones[0].contacto
          },
          null,
          2
        )
        : 'No hay cotizaciones'
    )

    return cotizaciones.map(cotizacion => {
      const tipoMapeado = cotizacion.tipoCotizacion

      // Obtener el nombre del contacto
      const nombreContacto = cotizacion.contacto?.nombre || 'Sin contacto'

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        empresa: cotizacion.empresa || 'No especificada',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion || 'No especificada',
        tipo: tipoMapeado,
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

export default async function Page() {
  const invoiceData = await getCotizaciones()

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InvoiceList invoiceData={invoiceData} />
    </Suspense>
  )
}
